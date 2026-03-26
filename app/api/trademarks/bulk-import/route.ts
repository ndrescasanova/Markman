/**
 * POST /api/trademarks/bulk-import
 * Phase 1 of the 3-step bulk import flow.
 *
 * Accepts a JSON body with an array of { serial_number, founder_email } rows.
 * Validates each row, fetches from TSDR, returns a preview with per-row status.
 * Does NOT write to the database.
 *
 * Max body size: 512KB (enforced by Next.js edge limit check).
 * After preview is confirmed, the client calls /api/trademarks/bulk-commit.
 */

import { createClient } from "@/lib/supabase/server";
import { fetchTrademarkBySerial } from "@/lib/uspto/tsdr";
import { TSDRUnavailableError } from "@/lib/uspto/types";
import { NextResponse } from "next/server";

const SERIAL_REGEX = /^\d{7,8}$/; // F-16

const MAX_ROWS = 200; // Safety cap per batch

export interface BulkImportRow {
  serial_number: string;
  founder_email: string;
}

export interface BulkImportPreviewRow {
  serial_number: string;
  founder_email: string;
  mark_name: string | null;
  status: string | null;
  expiration_date: string | null;
  founder_id: string | null;
  // Error classification
  error: string | null;
  is_csv_duplicate: boolean;  // duplicate within this CSV upload
  is_db_duplicate: boolean;   // already in founder's portfolio
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is an attorney
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "attorney") {
    return NextResponse.json({ error: "Only attorneys can use bulk import" }, { status: 403 });
  }

  let rows: BulkImportRow[];
  try {
    const body = await request.json();
    rows = body.rows;
    if (!Array.isArray(rows)) throw new Error("rows must be an array");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ROWS} rows per import` },
      { status: 400 }
    );
  }

  // Detect CSV-level duplicates (same serial_number appearing twice in this upload)
  const serialCounts = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.serial_number}|${row.founder_email}`;
    serialCounts.set(key, (serialCounts.get(key) || 0) + 1);
  }

  // Resolve founder emails to user IDs
  const emails = [...new Set(rows.map((r) => r.founder_email))];
  const { data: founders } = await supabase
    .from("users")
    .select("id, email")
    .in("email", emails)
    .eq("role", "founder");

  const founderByEmail = new Map(founders?.map((f) => [f.email, f.id]) ?? []);

  // Fetch existing trademarks for all founders (to detect DB duplicates)
  const founderIds = [...new Set(Object.values(Object.fromEntries(founderByEmail)))];
  const { data: existingTrademarks } = founderIds.length
    ? await supabase
        .from("trademarks")
        .select("user_id, serial_number")
        .in("user_id", founderIds)
    : { data: [] };

  const existingSet = new Set(
    existingTrademarks?.map((t) => `${t.user_id}|${t.serial_number}`) ?? []
  );

  // Process each row
  const preview: BulkImportPreviewRow[] = [];
  const seenKeys = new Set<string>();

  for (const row of rows) {
    const key = `${row.serial_number}|${row.founder_email}`;
    const founderId = founderByEmail.get(row.founder_email) ?? null;

    const previewRow: BulkImportPreviewRow = {
      serial_number: row.serial_number,
      founder_email: row.founder_email,
      mark_name: null,
      status: null,
      expiration_date: null,
      founder_id: founderId,
      error: null,
      is_csv_duplicate: seenKeys.has(key),
      is_db_duplicate: false,
    };

    seenKeys.add(key);

    // Validate founder email
    if (!founderId) {
      previewRow.error = `Founder ${row.founder_email} not found in Markman`;
      preview.push(previewRow);
      continue;
    }

    // Validate serial number format — skip TSDR call if invalid (F-16)
    if (!SERIAL_REGEX.test(row.serial_number)) {
      previewRow.error = "Invalid serial number — must be 7 or 8 digits";
      preview.push(previewRow);
      continue;
    }

    // Check DB duplicate
    if (existingSet.has(`${founderId}|${row.serial_number}`)) {
      previewRow.is_db_duplicate = true;
    }

    // Skip TSDR if CSV duplicate
    if (previewRow.is_csv_duplicate) {
      previewRow.error = "Duplicate serial number in this upload";
      preview.push(previewRow);
      continue;
    }

    // Fetch from TSDR
    try {
      const trademark = await fetchTrademarkBySerial(row.serial_number);
      if (!trademark) {
        previewRow.error = "Trademark not found — check the serial number";
      } else {
        previewRow.mark_name = trademark.markName;
        previewRow.status = trademark.status;
        previewRow.expiration_date = trademark.expirationDate;
      }
    } catch (err) {
      if (err instanceof TSDRUnavailableError) {
        // On TSDR outage, abort the preview entirely — don't save partial data
        return NextResponse.json(
          {
            error: "USPTO is temporarily unavailable. Your import was saved — retry in a few minutes.",
            partial_preview: preview,
          },
          { status: 503 }
        );
      }
      previewRow.error = "Failed to fetch from USPTO — try again";
    }

    preview.push(previewRow);
  }

  return NextResponse.json({ preview });
}
