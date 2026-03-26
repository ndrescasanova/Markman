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
      {/* Sidebar CTA button — DESIGN.md spec: white bg, barely-there border, micro shadow */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 text-[13px] font-[500] text-[#0A1628] transition-colors"
        style={{
          height: 34,
          background: "#FFFFFF",
          border: "1px solid rgba(10, 22, 40, 0.14)",
          borderRadius: 6,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(10,22,40,0.03)",
          letterSpacing: "-0.01em",
          cursor: "pointer",
          padding: "0 14px",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="5.5" y1="1" x2="5.5" y2="10" />
          <line x1="1" y1="5.5" x2="10" y2="5.5" />
        </svg>
        Invite Client
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.25)" }}
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg w-full max-w-[360px] mx-4 overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #E5E7EB" }}
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="px-6 py-8 text-center space-y-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: "#F0FDF4" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[15px] font-[600] text-[#0A1628]">Invite sent</p>
                <p className="text-[13px] text-[#6B7280]">
                  {email} will receive an email with a signup link.
                </p>
                <button
                  onClick={handleClose}
                  className="text-[13px] text-[#2563EB] hover:underline font-[500]"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 pt-6 pb-4 border-b border-[#F3F4F6]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-[600] text-[#0A1628]">Invite a client</h2>
                    <button
                      onClick={handleClose}
                      className="text-[#9CA3AF] hover:text-[#6B7280] text-xl leading-none w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-[13px] text-[#6B7280] mt-1">
                    Your client will receive a link to connect their portfolio.
                  </p>
                </div>
                <form onSubmit={handleInvite} className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-[500] text-[#374151]">
                      Client email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@acmecorp.com"
                      className="w-full h-10 px-3 text-[14px] border border-[#E5E7EB] rounded-md
                        focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-[#9CA3AF]"
                    />
                  </div>
                  {error && (
                    <p className="text-[12px] text-[#DC2626] px-3 py-2 bg-[#FEF2F2] rounded-md border border-[#FECACA]">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-[#2563EB] hover:bg-blue-700 text-white text-[14px] font-[500]
                      rounded-md disabled:opacity-50 transition-colors"
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
