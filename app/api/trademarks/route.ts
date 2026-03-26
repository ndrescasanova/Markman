import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTrademarkBySerial } from "@/lib/uspto/tsdr";
import { computeBrandHealthScore } from "@/lib/brand-health/score";
import { TSDRUnavailableError } from "@/lib/uspto/types";
import { NextResponse } from "next/server";

// F-16: serial number validation — 7 or 8 digits only
const SERIAL_REGEX = /^\d{7,8}$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { serial_number: string; founder_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { serial_number, founder_id } = body;

  // F-16: Validate serial before any TSDR call
  if (!SERIAL_REGEX.test(serial_number ?? "")) {
    return NextResponse.json(
      { error: "Invalid serial number — must be 7 or 8 digits" },
      { status: 400 }
    );
  }

  // Determine target user — attorney can add marks for their clients
  let targetUserId = user.id;
  if (founder_id && founder_id !== user.id) {
    // Verify attorney-client relationship
    const { data: rel } = await supabase
      .from("attorney_clients")
      .select("id")
      .eq("attorney_id", user.id)
      .eq("client_id", founder_id)
      .maybeSingle();

    if (!rel) {
      return NextResponse.json(
        { error: "Forbidden — founder is not in your client list" },
        { status: 403 }
      );
    }
    targetUserId = founder_id;
  }

  // Fetch from USPTO TSDR
  let trademark;
  try {
    trademark = await fetchTrademarkBySerial(serial_number);
  } catch (err) {
    if (err instanceof TSDRUnavailableError) {
      return NextResponse.json(
        { error: "USPTO is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }
    throw err;
  }

  if (!trademark) {
    return NextResponse.json(
      { error: "Trademark not found — check the serial number and try again" },
      { status: 404 }
    );
  }

  // Insert trademark
  const admin = createAdminClient();
  const { data: inserted, error: insertError } = await admin
    .from("trademarks")
    .insert({
      user_id: targetUserId,
      serial_number: trademark.serialNumber,
      registration_number: trademark.registrationNumber,
      mark_name: trademark.markName,
      status: trademark.status,
      expiration_date: trademark.expirationDate,
      owner_name: trademark.ownerName,
      goods_services: trademark.goodsServices,
      international_class: trademark.internationalClass,
      sync_status: "ok",
      last_synced_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This trademark is already in your portfolio" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to save trademark" }, { status: 500 });
  }

  // Recompute and persist score
  await recomputeScore(admin, targetUserId);

  return NextResponse.json(inserted, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const founderId = searchParams.get("founder_id");

  let query = supabase.from("trademarks").select("*");

  if (founderId && founderId !== user.id) {
    // Attorney fetching client trademarks — RLS enforces attorney_clients relationship
    query = query.eq("user_id", founderId);
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch trademarks" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("trademarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // RLS: only own trademarks

  if (error) {
    return NextResponse.json({ error: "Failed to delete trademark" }, { status: 500 });
  }

  await recomputeScore(createAdminClient(), user.id);

  return NextResponse.json({ ok: true });
}

async function recomputeScore(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: trademarks } = await admin
    .from("trademarks")
    .select("status, expiration_date")
    .eq("user_id", userId);

  if (!trademarks) return;

  const score = computeBrandHealthScore(
    trademarks.map((t) => ({
      status: t.status,
      expiration_date: t.expiration_date,
    }))
  );

  if (score !== null) {
    await admin.from("score_history").insert({
      user_id: userId,
      score,
      computed_at: new Date().toISOString(),
    });
  }
}
