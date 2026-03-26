/**
 * GET /api/cron/daily-maintenance
 * Runs at 02:30 UTC daily (30 minutes after daily-sync).
 *
 * Maintenance tasks:
 * - Clean up expired, unused invite tokens
 * - Future: other housekeeping tasks
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  // Clean up expired + unused invites older than 7 days
  const { count: deletedInvites } = await admin
    .from("invites")
    .delete({ count: "exact" })
    .lt("expires_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .is("used_at", null);

  return NextResponse.json({
    deleted_invites: deletedInvites ?? 0,
    timestamp: now,
  });
}
