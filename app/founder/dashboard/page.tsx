import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeBrandHealthScore } from "@/lib/brand-health/score";
import { ScoreGauge } from "@/components/markman/ScoreGauge";
import { StatusBadge } from "@/components/markman/StatusBadge";
import { AddTrademarkForm } from "@/components/markman/AddTrademarkForm";
import { AppShell } from "@/components/markman/AppShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FounderDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: trademarks }, { data: attorney }] =
    await Promise.all([
      supabase.from("users").select("display_name, email, role").eq("id", user.id).single(),
      supabase
        .from("trademarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("attorney_clients")
        .select("attorney_id, users!attorney_clients_attorney_id_fkey(display_name, email)")
        .eq("client_id", user.id)
        .maybeSingle(),
    ]);

  if (profile?.role === "attorney") redirect("/attorney/dashboard");

  const tms = trademarks ?? [];
  const score = computeBrandHealthScore(
    tms.map((t) => ({ status: t.status, expiration_date: t.expiration_date }))
  );

  // Renewal timeline — marks expiring within 90 days
  const today = new Date();
  const urgentMarks = tms
    .filter((t) => t.expiration_date)
    .map((t) => {
      const expiry = new Date(t.expiration_date!);
      const daysLeft = Math.floor(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...t, daysLeft };
    })
    .filter((t) => t.daysLeft < 90)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const attorneyInfo = (attorney?.users as unknown as { display_name: string | null; email: string } | null);
  const userDisplay = profile?.display_name || profile?.email || "";

  return (
    <AppShell role="founder" userDisplay={userDisplay}>
      <div className="px-8 py-8 space-y-6 max-w-[960px]">

        {/* ── Brand Health Strip ── */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="flex items-center gap-8 px-8 py-6">
            {/* Arc gauge */}
            <div className="shrink-0">
              <ScoreGauge score={score} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {score !== null ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-[500] tracking-[0.08em] uppercase text-[#8C7355]">
                      Portfolio Summary
                    </p>
                    <p className="text-[15px] text-[#6B7280] mt-1">
                      {tms.length} trademark{tms.length !== 1 ? "s" : ""} tracked
                      {urgentMarks.length > 0 && (
                        <span className="text-[#D97706]">
                          {" "}· {urgentMarks.length} renewal{urgentMarks.length !== 1 ? "s" : ""} due soon
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-[12px] text-[#9CA3AF] leading-relaxed max-w-sm">
                    This score reflects renewal status and registration data.
                    It is not a legal opinion.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[15px] font-[600] text-[#0A1628]">
                    Add your first trademark
                  </p>
                  <p className="text-[14px] text-[#6B7280]">
                    Enter your USPTO serial number below to start tracking renewals
                    and get your brand health score.
                  </p>
                </div>
              )}
            </div>

            {/* PDF Export — locked if no subscription */}
            <div className="shrink-0 hidden md:block">
              <a
                href="/api/portfolio/export"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] text-[#6B7280] border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] transition-colors no-underline"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v8M5 7l3 3 3-3M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" />
                </svg>
                Export PDF
              </a>
            </div>
          </div>
        </section>

        {/* ── Trademarks Table ── */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-[14px] font-[600] text-[#0A1628]">
              Trademarks
            </h2>
            <span className="text-[12px] text-[#9CA3AF]">{tms.length} total</span>
          </div>

          {tms.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="px-5 py-3 text-left text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.06em]">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.06em]">
                      Mark
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.06em]">
                      Serial #
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.06em]">
                      Renewal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tms.map((tm) => {
                    const daysLeft = tm.expiration_date
                      ? Math.floor(
                          (new Date(tm.expiration_date).getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                        )
                      : null;
                    const isUrgent = daysLeft !== null && daysLeft < 30;
                    const isWarning = daysLeft !== null && daysLeft >= 30 && daysLeft < 90;

                    return (
                      <tr
                        key={tm.id}
                        className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <StatusBadge status={tm.status} />
                          {tm.sync_status === "error" && (
                            <span className="ml-1.5 text-[11px] text-[#D97706]" title={tm.sync_error ?? ""}>
                              ⚠
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[14px] font-[500] text-[#0A1628]">
                          {tm.mark_name}
                        </td>
                        <td className="px-5 py-3.5">
                          {/* Chip style per DESIGN.md */}
                          <span className="inline-flex items-center px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded text-[11px] text-[#9CA3AF]"
                            style={{ fontVariantNumeric: "tabular-nums" }}>
                            {tm.serial_number}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {tm.expiration_date ? (
                            <span
                              className={`text-[13px] font-mono ${
                                isUrgent
                                  ? "text-[#DC2626]"
                                  : isWarning
                                  ? "text-[#D97706]"
                                  : "text-[#6B7280]"
                              }`}
                            >
                              {tm.expiration_date}
                              {daysLeft !== null && daysLeft < 90 && (
                                <span className="ml-1.5 text-[11px]">
                                  ({daysLeft < 0 ? "expired" : `${daysLeft}d`})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[13px] text-[#9CA3AF]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add trademark form */}
          <div className={`px-6 py-4 ${tms.length > 0 ? "border-t border-[#F3F4F6]" : ""}`}>
            {tms.length === 0 && (
              <p className="text-[13px] text-[#9CA3AF] mb-3">
                No trademarks yet. Enter your USPTO serial number to get started.
              </p>
            )}
            <AddTrademarkForm />
          </div>
        </section>

        {/* ── Renewal Timeline ── */}
        {urgentMarks.length > 0 && (
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[14px] font-[600] text-[#0A1628]">Upcoming Renewals</h2>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">Next 90 days · sorted by urgency</p>
            </div>
            <ul className="divide-y divide-[#F3F4F6]">
              {urgentMarks.map((tm) => {
                const isUrgent = tm.daysLeft < 30;
                const urgencyColor = isUrgent ? "text-[#DC2626]" : "text-[#D97706]";
                return (
                  <li key={tm.id} className="px-6 py-4">
                    {/* Renewal assistant panel per DESIGN.md */}
                    <div
                      className={`rounded-md border px-4 py-3 ${
                        isUrgent
                          ? "bg-[#FEF2F2] border-[#FECACA]"
                          : "bg-[#FFFBEB] border-[#FDE68A]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-[13px] font-[600] ${urgencyColor}`}>
                            {isUrgent ? "⚠ " : ""}
                            {tm.daysLeft < 0
                              ? `${tm.mark_name} — EXPIRED`
                              : tm.daysLeft === 0
                              ? `${tm.mark_name} — expires today`
                              : `${tm.mark_name} — due in ${tm.daysLeft} days`}
                          </p>
                          <p className="text-[12px] text-[#6B7280] mt-1">
                            Your trademark needs to be renewed to stay active.
                            File your §8 Declaration with the USPTO by{" "}
                            <span className="font-mono">{tm.expiration_date}</span>.
                          </p>
                        </div>
                        <a
                          href="https://www.uspto.gov/trademarks/maintain/after-registration"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[12px] text-[#2563EB] hover:underline whitespace-nowrap"
                        >
                          Learn more ↗
                        </a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ── Attorney Strip ── */}
        {attorneyInfo && (
          <section className="bg-white border border-[#E5E7EB] rounded-lg px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-[500] tracking-[0.06em] uppercase text-[#8C7355] mb-1">
                Your Attorney
              </p>
              <p className="text-[14px] font-[500] text-[#0A1628]">
                {attorneyInfo.display_name || attorneyInfo.email}
              </p>
            </div>
            <Link
              href="/messages"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-[500] text-[#2563EB] border border-[#2563EB] rounded-md hover:bg-[#EFF6FF] transition-colors no-underline"
            >
              Message
            </Link>
          </section>
        )}

        {/* ── Phase 2 locked card ── */}
        <section
          className="border border-dashed border-[#E5E7EB] rounded-lg px-6 py-5"
          style={{ background: "#FAFAFA" }}
        >
          <p className="text-[14px] font-[600] text-[#9CA3AF]">Conflict Monitoring</p>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            Available soon — AI-powered conflict detection coming in Phase 2.
          </p>
        </section>

      </div>
    </AppShell>
  );
}
