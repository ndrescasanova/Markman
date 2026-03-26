"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SERIAL_REGEX = /^\d{7,8}$/;

interface Props {
  founderId?: string; // if attorney adding for a client
}

export function AddTrademarkForm({ founderId }: Props = {}) {
  const [serial, setSerial] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = serial.trim();

    if (!SERIAL_REGEX.test(trimmed)) {
      setError("Serial number must be 7 or 8 digits.");
      return;
    }

    setStatus("loading");
    setError(null);

    const res = await fetch("/api/trademarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serial_number: trimmed,
        ...(founderId ? { founder_id: founderId } : {}),
      }),
    });

    if (res.ok) {
      setSerial("");
      setStatus("success");
      router.refresh(); // re-fetch server component data
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add trademark. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <input
          type="text"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Enter USPTO serial number (e.g. 98123456)"
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          disabled={status === "loading"}
          maxLength={8}
          inputMode="numeric"
          pattern="\d{7,8}"
        />
        {error && <p className="mt-1 text-xs text-[#DC2626]">{error}</p>}
        {status === "success" && (
          <p className="mt-1 text-xs text-[#16A34A]">Trademark added successfully.</p>
        )}
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Find serial numbers at{" "}
          <a
            href="https://tsdr.uspto.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2563EB] hover:underline"
          >
            tsdr.uspto.gov
          </a>
        </p>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 whitespace-nowrap self-start"
      >
        {status === "loading" ? "Looking up…" : "Add trademark"}
      </button>
    </form>
  );
}
