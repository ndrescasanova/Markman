/**
 * /invite/[token]
 * Founder signup via attorney invite.
 * Role is locked to 'founder' — cannot be changed.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import InviteSignupForm from "./InviteSignupForm";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // Validate invite token
  const { data: invite } = await admin
    .from("invites")
    .select("id, client_email, attorney_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-2xl text-[#0A1628]">Invite not found</h1>
          <p className="text-sm text-[#6B7280]">
            This invite link is invalid or has already been used.
          </p>
        </div>
      </div>
    );
  }

  if (invite.used_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-2xl text-[#0A1628]">Invite already used</h1>
          <p className="text-sm text-[#6B7280]">
            This invite has already been accepted.{" "}
            <a href="/login" className="text-[#2563EB] hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-2xl text-[#0A1628]">Invite expired</h1>
          <p className="text-sm text-[#6B7280]">
            This invite link expired. Ask your attorney to resend the invite.
          </p>
        </div>
      </div>
    );
  }

  // Get attorney name for welcome message
  const { data: attorney } = await admin
    .from("users")
    .select("display_name, email")
    .eq("id", invite.attorney_id)
    .single();

  const attorneyName = attorney?.display_name || attorney?.email || "Your attorney";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-sm space-y-8 px-4">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-[#0A1628]">Markman</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            {attorneyName} invited you to view your trademarks
          </p>
        </div>
        <InviteSignupForm
          token={token}
          inviteEmail={invite.client_email}
          attorneyId={invite.attorney_id}
        />
      </div>
    </div>
  );
}
