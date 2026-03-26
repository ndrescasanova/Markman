/**
 * POST /api/trademarks/bulk-commit
 * Phase 3 of the 3-step bulk import flow.
 *
 * Commits confirmed preview rows to the database using a Postgres RPC function
 * (bulk_commit_trademarks) so the entire batch runs in a single transaction (F-12).
 * Skips rows with errors, CSV duplicates, and DB duplicates.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeBrandHealthScore } from "@/lib/brand-health/score";
import { NextResponse } from "next/server";
import type { BulkImportPreviewRow } from "../bulk-import/route";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "attorney") {
    return NextResponse.json({ error: "Only attorneys can use bulk commit" }, { status: 403 });
  }

  let preview: BulkImportPreviewRow[];
  try {
    const body = await request.json();
    preview = body.preview;
    if (!Array.isArray(preview)) throw new Error("preview must be an array");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Filter to rows that are committal: no error, not csv_duplicate, has founder_id
  // DB duplicates are skipped (ON CONFLICT DO NOTHING in RPC)
  const commitRows = preview
    .filter(
      (row) =>
        !row.error &&
        !row.is_csv_duplicate &&
        row.founder_id !== null &&
        row.mark_name !== null
    )
    .map((row) => ({
      user_id: row.founder_id!,
      serial_number: row.serial_number,
      mark_name: row.mark_name!,
      status: row.status ?? "UNKNOWN",
      expiration_date: row.expiration_date ?? null,
      registration_number: null,
      owner_name: null,
      goods_services: null,
      international_class: null,
    }));

  if (commitRows.length === 0) {
    return NextResponse.json({ committed: 0, skipped: preview.length });
  }

  // Use service role for the RPC — runs in a single transaction (F-12)
  const admin = createAdminClient();
  const { error: rpcError } = await admin.rpc("bulk_commit_trademarks", {
    p_rows: commitRows,
  });

  if (rpcError) {
    return NextResponse.json(
      { error: "Failed to commit trademarks", detail: rpcError.message },
      { status: 500 }
    );
  }

  // Recompute scores for all affected founders
  const affectedFounderIds = Array.from(new Set(commitRows.map((r) => r.user_id)));
  await recomputeScoresForFounders(admin, affectedFounderIds);

  return NextResponse.json({
    committed: commitRows.length,
    skipped: preview.length - commitRows.length,
  });
}

async function recomputeScoresForFounders(
  admin: ReturnType<typeof createAdminClient>,
  founderIds: string[]
) {
  // Batch query — no N+1 (MEDIUM-2 mitigation)
  const { data: allTrademarks } = await admin
    .from("trademarks")
    .select("user_id, status, expiration_date")
    .in("user_id", founderIds);

  if (!allTrademarks) return;

  // Group by founder
  const byFounder = new Map<string, { status: string; expiration_date: string | null }[]>();
  for (const tm of allTrademarks) {
    if (!byFounder.has(tm.user_id)) byFounder.set(tm.user_id, []);
    byFounder.get(tm.user_id)!.push(tm);
  }

  const scoreRows = [];
  for (const [userId, trademarks] of byFounder) {
    const score = computeBrandHealthScore(
      trademarks.map((t) => ({
        status: t.status as never,
        expiration_date: t.expiration_date,
      }))
    );
    if (score !== null) {
      scoreRows.push({ user_id: userId, score, computed_at: new Date().toISOString() });
    }
  }

  if (scoreRows.length > 0) {
    await admin.from("score_history").insert(scoreRows);
  }
}
