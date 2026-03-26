"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  token: string;
  inviteEmail: string;
  attorneyId: string;
}

export default function InviteSignupForm({ token, inviteEmail, attorneyId }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Sign up with role locked to 'founder'
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: inviteEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          role: "founder", // locked — cannot be changed by client
          display_name: displayName,
          invite_token: token,
          attorney_id: attorneyId,
        },
      },
    });

    if (signUpError || !data.user) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Mark invite as used + create attorney_clients relationship
    await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    router.push("/dashboard?welcome=1");
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="p-3 bg-[#EFF6FF] rounded-md">
        <p className="text-sm text-[#1D4ED8]">
          Signing up as <strong>{inviteEmail}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0A1628] mb-1">
          Your name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          placeholder="First and last name"
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0A1628] mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />
        <p className="mt-1 text-xs text-[#6B7280]">Minimum 8 characters</p>
      </div>

      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
