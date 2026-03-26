"use client";

import { useState } from "react";
import type { BulkImportPreviewRow } from "@/app/api/trademarks/bulk-import/route";
import { StatusBadge } from "@/components/markman/StatusBadge";

interface Props {
  clients: { email: string; name: string }[];
}

type Step = "upload" | "preview" | "committing" | "done";

export default function BulkImportClient({ clients }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<BulkImportPreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ committed: number; skipped: number } | null>(null);

  // Parse CSV: serial_number,founder_email
  function parseCSV(text: string): { serial_number: string; founder_email: string }[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().startsWith("serial"))
      .map((line) => {
        const [serial, email] = line.split(",").map((s) => s.trim());
        return { serial_number: serial || "", founder_email: email || "" };
      })
      .filter((r) => r.serial_number && r.founder_email);
  }

  async function handlePreview() {
    setLoading(true);
    setError(null);

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      setError("No valid rows found. Format: serial_number,founder_email");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/trademarks/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Preview failed. Please try again.");
      setLoading(false);
      return;
    }

    setPreview(data.preview);
    setStep("preview");
    setLoading(false);
  }

  async function handleCommit() {
    setStep("committing");
    setError(null);

    const res = await fetch("/api/trademarks/bulk-commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preview }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Commit failed. Please try again.");
      setStep("preview");
      return;
    }

    setResult(data);
    setStep("done");
  }

  const validRows = preview.filter((r) => !r.error && !r.is_csv_duplicate);
  const errorRows = preview.filter((r) => r.error || r.is_csv_duplicate);

  if (step === "done" && result) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg px-6 py-8 text-center">
        <p className="text-2xl font-mono text-[#16A34A] mb-2">{result.committed}</p>
        <p className="text-sm font-medium text-[#0A1628]">
          trademark{result.committed !== 1 ? "s" : ""} imported
        </p>
        {result.skipped > 0 && (
          <p className="text-xs text-[#9CA3AF] mt-1">{result.skipped} rows skipped</p>
        )}
        <button
          onClick={() => { setStep("upload"); setCsvText(""); setPreview([]); setResult(null); }}
          className="mt-6 text-sm text-[#2563EB] hover:underline"
        >
          Import more
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0A1628] mb-2">
              CSV format: <code className="text-xs bg-[#F3F4F6] px-1 py-0.5 rounded">serial_number,founder_email</code>
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"serial_number,founder_email\n98123456,jane@acmecorp.com\n87654321,john@betallc.com"}
              rows={8}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {clients.length > 0 && (
            <details className="text-xs text-[#9CA3AF]">
              <summary className="cursor-pointer hover:text-[#6B7280]">Your clients ({clients.length})</summary>
              <ul className="mt-1 space-y-0.5 font-mono">
                {clients.map((c) => (
                  <li key={c.email}>{c.email} — {c.name}</li>
                ))}
              </ul>
            </details>
          )}

          {error && <p className="text-sm text-[#DC2626]">{error}</p>}

          <button
            onClick={handlePreview}
            disabled={loading || !csvText.trim()}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Looking up marks…" : "Preview import"}
          </button>
        </div>
      )}

      {(step === "preview" || step === "committing") && (
        <div className="space-y-4">
          {errorRows.length > 0 && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-[#DC2626] mb-2">
                {errorRows.length} row{errorRows.length !== 1 ? "s" : ""} with issues (will be skipped)
              </p>
              <ul className="space-y-1">
                {errorRows.map((r, i) => (
                  <li key={i} className="text-xs text-[#DC2626]">
                    {r.serial_number} — {r.founder_email}: {r.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <p className="text-sm font-medium text-[#0A1628]">
                {validRows.length} mark{validRows.length !== 1 ? "s" : ""} ready to import
              </p>
              {step === "preview" && (
                <button
                  onClick={() => setStep("upload")}
                  className="text-xs text-[#6B7280] hover:underline"
                >
                  Edit CSV
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">Mark</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">Serial</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">Client</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {validRows.map((row, i) => (
                    <tr key={i} className={row.is_db_duplicate ? "opacity-50" : ""}>
                      <td className="px-4 py-3">
                        {row.mark_name}
                        {row.is_db_duplicate && (
                          <span className="ml-1 text-xs text-[#9CA3AF]">(already in portfolio)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{row.serial_number}</td>
                      <td className="px-4 py-3">
                        {row.status && <StatusBadge status={row.status} />}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B7280]">{row.founder_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between">
              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
              <button
                onClick={handleCommit}
                disabled={step === "committing" || validRows.length === 0}
                className="ml-auto px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 transition-colors"
              >
                {step === "committing" ? "Committing…" : `Import ${validRows.length} mark${validRows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
