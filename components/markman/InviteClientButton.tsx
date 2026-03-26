"use client";

import { useState } from "react";

export default function InviteClientButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_email: email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to send invite. Please try again.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  function handleClose() {
    setOpen(false);
    setEmail("");
    setError(null);
    setSent(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#2563EB] hover:underline"
      >
        Invite client
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="text-center py-2">
                <p className="text-sm font-medium text-[#0A1628] mb-1">Invite sent</p>
                <p className="text-xs text-[#9CA3AF] mb-4">
                  {email} will receive an email with a signup link.
                </p>
                <button
                  onClick={handleClose}
                  className="text-sm text-[#2563EB] hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#0A1628]">Invite a client</h2>
                  <button
                    onClick={handleClose}
                    className="text-[#9CA3AF] hover:text-[#6B7280] text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleInvite} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1">
                      Client email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@acmecorp.com"
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  {error && <p className="text-xs text-[#DC2626]">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Sending…" : "Send invite"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
