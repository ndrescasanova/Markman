"use client";

import { useState } from "react";

interface Props {
  isSubscribed: boolean;
}

export default function UpgradeClient({ isSubscribed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/upgrade/checkout", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  if (isSubscribed) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg px-6 py-8 text-center">
        <p className="text-2xl font-mono text-[#16A34A] mb-2">Active</p>
        <p className="text-sm font-medium text-[#0A1628]">
          You have an active Markman subscription.
        </p>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Your portfolio monitoring and alerts are running.
        </p>
        <a
          href="/founder/dashboard"
          className="mt-6 inline-block text-sm text-[#2563EB] hover:underline"
        >
          Back to dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pricing card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E5E7EB]">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
            Markman Pro
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-mono font-medium text-[#0A1628]">$99</span>
            <span className="text-sm text-[#9CA3AF]">/ year</span>
          </div>
        </div>

        <ul className="px-6 py-5 space-y-3">
          {[
            "Daily USPTO sync — always current status",
            "Renewal alerts 90, 60, and 30 days out",
            "Brand health score",
            "Attorney messaging",
            "PDF portfolio export",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-[#374151]">
              <span className="mt-0.5 text-[#16A34A] flex-shrink-0">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="px-6 pb-6">
          {error && <p className="text-sm text-[#DC2626] mb-3">{error}</p>}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-[#0A1628] hover:bg-[#1e2d42] text-white text-sm font-medium rounded-md disabled:opacity-50 transition-colors"
          >
            {loading ? "Redirecting to checkout…" : "Start for $99 / year"}
          </button>
          <p className="text-xs text-center text-[#9CA3AF] mt-2">
            Secure checkout via Stripe. Cancel anytime.
          </p>
        </div>
      </div>

      <p className="text-xs text-center text-[#9CA3AF]">
        Questions?{" "}
        <a href="/messages" className="text-[#2563EB] hover:underline">
          Message your attorney
        </a>
      </p>
    </div>
  );
}
