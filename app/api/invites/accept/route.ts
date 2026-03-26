/**
 * POST /api/invites/accept
 * Called after successful signup via invite link.
 * Marks the invite as used and creates the attorney_clients relationship.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch and validate invite
  const { data: invite } = await admin
    .from("invites")
    .select("id, attorney_id, client_email, used_at, expires_at")
    .eq("token", body.token)
    .maybeSingle();

  if (!invite || invite.used_at || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  // Verify email matches
  if (invite.client_email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
  }

  // Mark invite as used
  await admin
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Create attorney_clients relationship
  await admin
    .from("attorney_clients")
    .insert({
      attorney_id: invite.attorney_id,
      client_id: user.id,
    })
    .throwOnError();

  return NextResponse.json({ ok: true });
}
