/**
 * GET /api/cron/daily-sync
 * Runs at 02:00 UTC daily.
 *
 * Syncs TSDR data for the next batch of founders (cursor-based pagination, TODO-007).
 * Fetches up to 50 founders ordered by least-recently-synced.
 * After sync: recomputes brand health score, checks for milestone transitions.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTrademarkBySerial } from "@/lib/uspto/tsdr";
import { computeBrandHealthScore } from "@/lib/brand-health/score";
import { sendMilestoneEmail, sendRenewalAlert } from "@/lib/email/resend";
import { TSDRUnavailableError } from "@/lib/uspto/types";
import { NextResponse } from "next/server";

const BATCH_SIZE = 50; // TODO-007: paginated to stay within Vercel Hobby 60s limit
const RENEWAL_30D_WINDOW = 30;

// Validate cron secret to prevent unauthorized invocations
function validateCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Cursor-based pagination: founders ordered by least-recently-synced (TODO-007)
  const { data: founders, error: foundersError } = await admin
    .from("users")
    .select("id, email")
    .eq("role", "founder")
    .order("last_cron_synced_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (foundersError || !founders?.length) {
    return NextResponse.json({ synced: 0, message: "No founders to sync" });
  }

  let syncedCount = 0;
  let errorCount = 0;
  let tsdrOutage = false;

  for (const founder of founders) {
    if (tsdrOutage) break; // F-01: circuit breaker — halt on outage

    const { data: trademarks } = await admin
      .from("trademarks")
      .select("id, serial_number, status, expiration_date")
      .eq("user_id", founder.id);

    if (!trademarks?.length) {
      await admin
        .from("users")
        .update({ last_cron_synced_at: now })
        .eq("id", founder.id);
      continue;
    }

    const updatedTrademarks = [];
    let consecutiveFailures = 0;

    for (const tm of trademarks) {
      if (consecutiveFailures >= 5) {
        // F-01: 5 consecutive failures = circuit breaker trips
        tsdrOutage = true;
        break;
      }

      try {
        const tsdrData = await fetchTrademarkBySerial(tm.serial_number);

        if (tsdrData) {
          const previousStatus = tm.status;

          await admin
            .from("trademarks")
            .update({
              status: tsdrData.status,
              expiration_date: tsdrData.expirationDate,
              registration_number: tsdrData.registrationNumber,
              owner_name: tsdrData.ownerName,
              goods_services: tsdrData.goodsServices,
              sync_status: "ok",
              sync_error: null,
              last_synced_at: now,
            })
            .eq("id", tm.id);

          updatedTrademarks.push({
            ...tm,
            status: tsdrData.status,
            expiration_date: tsdrData.expirationDate,
            previousStatus,
          });
          consecutiveFailures = 0;
        } else {
          await admin
            .from("trademarks")
            .update({ sync_status: "error", sync_error: "Not found in TSDR" })
            .eq("id", tm.id);
          consecutiveFailures++;
        }
      } catch (err) {
        if (err instanceof TSDRUnavailableError) {
          consecutiveFailures++;
          await admin
            .from("trademarks")
            .update({ sync_status: "error", sync_error: err.message })
            .eq("id", tm.id);
        } else {
          errorCount++;
        }
      }
    }

    if (!tsdrOutage) {
      // Recompute brand health score
      const allTrademarks = await admin
        .from("trademarks")
        .select("status, expiration_date")
        .eq("user_id", founder.id);

      const score = computeBrandHealthScore(
        (allTrademarks.data ?? []).map((t) => ({
          status: t.status,
          expiration_date: t.expiration_date,
        }))
      );

      if (score !== null) {
        await admin.from("score_history").insert({
          user_id: founder.id,
          score,
          computed_at: now,
        });
      }

      // Check for milestone transitions (PENDING → REGISTERED)
      for (const tm of updatedTrademarks) {
        if (
          tm.previousStatus !== "REGISTERED" &&
          tm.status === "REGISTERED" &&
          tm.expiration_date
        ) {
          await maybeSendMilestoneEmail(admin, founder, tm);
        }

        // Renewal alerts
        if (tm.expiration_date) {
          await maybeSendRenewalAlert(admin, founder, tm);
        }
      }

      // Update cron cursor
      await admin
        .from("users")
        .update({ last_cron_synced_at: now })
        .eq("id", founder.id);

      syncedCount++;
    }
  }

  return NextResponse.json({
    synced: syncedCount,
    errors: errorCount,
    tsdr_outage: tsdrOutage,
    timestamp: now,
  });
}

async function maybeSendMilestoneEmail(
  admin: ReturnType<typeof createAdminClient>,
  founder: { id: string; email: string },
  tm: { serial_number: string; status: string }
) {
  // F-06: 1 milestone email per founder per day (no serial_number in unique key)
  const { error: insertError } = await admin
    .from("notifications")
    .insert({
      user_id: founder.id,
      event_type: "milestone",
      serial_number: null, // F-06: milestone uniqueness is per-user-per-day, not per serial
    });

  if (insertError) return; // Already sent today — unique constraint prevents duplicate

  // Get registration number for the email
  const { data: trademark } = await admin
    .from("trademarks")
    .select("mark_name, registration_number")
    .eq("user_id", founder.id)
    .eq("serial_number", tm.serial_number)
    .maybeSingle();

  if (!trademark) return;

  await sendMilestoneEmail({
    to: founder.email,
    markName: trademark.mark_name,
    registrationNumber: trademark.registration_number || tm.serial_number,
  }).catch(() => {});
}

async function maybeSendRenewalAlert(
  admin: ReturnType<typeof createAdminClient>,
  founder: { id: string; email: string },
  tm: { serial_number: string; expiration_date: string | null }
) {
  if (!tm.expiration_date) return;

  const today = new Date();
  const expiry = new Date(tm.expiration_date);
  const daysRemaining = Math.floor(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Send at 30-day and 7-day windows
  if (daysRemaining !== 30 && daysRemaining !== 7) return;

  const eventType = daysRemaining <= RENEWAL_30D_WINDOW ? "renewal_30d" : "renewal_7d";

  // Per-trademark per-day dedup (serial_number is included in unique key for renewals)
  const { error: insertError } = await admin
    .from("notifications")
    .insert({
      user_id: founder.id,
      event_type: eventType,
      serial_number: tm.serial_number,
    });

  if (insertError) return; // Already sent today

  const { data: trademark } = await admin
    .from("trademarks")
    .select("mark_name")
    .eq("user_id", founder.id)
    .eq("serial_number", tm.serial_number)
    .maybeSingle();

  if (!trademark) return;

  await sendRenewalAlert({
    to: founder.email,
    markName: trademark.mark_name,
    daysRemaining,
    serialNumber: tm.serial_number,
  }).catch(() => {});
}
