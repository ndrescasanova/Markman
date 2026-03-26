import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeBrandHealthScore } from "@/lib/brand-health/score";
import { StatusBadge } from "@/components/markman/StatusBadge";
import { ScoreGauge } from "@/components/markman/ScoreGauge";
import { AddTrademarkForm } from "@/components/markman/AddTrademarkForm";
import { AppShell } from "@/components/markman/AppShell";
import InviteClientButton from "@/components/markman/InviteClientButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "attorney") redirect("/founder/dashboard");

  const { id: clientId } = await params;

  // Verify this client belongs to this attorney
  const { data: relation } = await supabase
    .from("attorney_clients")
    .select("client_id")
    .eq("attorney_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!relation) redirect("/attorney/dashboard");

  const [{ data: client }, { data: trademarks }, { data: scores }] =
    await Promise.all([
      supabase
        .from("users")
        .select("email, display_name")
        .eq("id", clientId)
        .single(),
      supabase
        .from("trademarks")
        .select("id, mark_name, serial_number, status, expiration_date, sync_status, sync_error")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("score_history")
        .select("score, computed_at")
        .eq("user_id", clientId)
        .order("computed_at", { ascending: false })
        .limit(10),
    ]);

  const tms = trademarks ?? [];
  const score = computeBrandHealthScore(
    tms.map((t) => ({ status: t.status, expiration_date: t.expiration_date }))
  );

  const today = new Date();
  const upcomingRenewals = tms
    .filter((t) => t.expiration_date)
    .map((t) => {
      const daysLeft = Math.floor(
        (new Date(t.expiration_date!).getTime() - today.getTime()) / 86400000
      );
      return { ...t, daysLeft };
    })
    .filter((t) => t.daysLeft < 90)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const clientName = client?.display_name || client?.email || "Client";
  const userDisplay = profile?.display_name || profile?.email || "";

  return (
    <AppShell
      role="attorney"
      userDisplay={userDisplay}
      sidebarAction={<InviteClientButton />}
    >
      <div className="px-8 py-8 space-y-6 max-w-[960px]">

        {/* ── Breadcrumb + Header ── */}
        <div>
          <Link
            href="/attorney/dashboard"
            className="text-[13px] text-[#6B7280] hover:text-[#0A1628] no-underline transition-colors"
          >
            ← Clients
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-[600] text-[#0A1628] tracking-tight">
                {clientName}
              </h1>
              {client?.display_name && (
                <p className="text-[13px] text-[#6B7280] mt-0.5">{client.email}</p>
              )}
            </div>
            <Link
              href="/messages"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-[500] text-[#2563EB] border border-[#2563EB] rounded-md hover:bg-[#EFF6FF] transition-colors no-underline shrink-0"
            >
              Message
            </Link>
          </div>
        </div>

        {/* ── Brand Health Strip ── */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="flex items-center gap-8 px-8 py-6">
            <div className="shrink-0">
              <ScoreGauge score={score} />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-[11px] font-[500] tracking-[0.08em] uppercase text-[#8C7355]">
                Brand Health
              </p>
              <p className="text-[15px] text-[#6B7280]">
                {tms.length} trademark{tms.length !== 1 ? "s" : ""} in portfolio
                {upcomingRenewals.length > 0 && (
                  <span className="text-[#D97706]">
                    {" "}· {upcomingRenewals.length} renewal{upcomingRenewals.length !== 1 ? "s" : ""} due soon
                  </span>
                )}
              </p>
              <p className="text-[12px] text-[#9CA3AF]">
                This score reflects renewal status and registration data. Not legal advice.
              </p>
            </div>

            {/* Score history mini-table */}
            {scores && scores.length > 0 && (
              <div className="shrink-0 hidden lg:block">
                <p className="text-[11px] font-[500] tracking-[0.06em] uppercase text-[#6B7280] mb-2">
                  History
                </p>
                <div className="space-y-1">
                  {scores.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[11px] text-[#9CA3AF] font-mono w-20">
                        {new Date(s.computed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span
                        className="text-[13px] font-mono font-[500]"
                        style={{
                          color: s.score >= 60 ? "#16A34A" : s.score >= 40 ? "#D97706" : "#DC2626",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {s.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Trademarks ── */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-[14px] font-[600] text-[#0A1628]">Trademarks</h2>
            <span className="text-[12px] text-[#9CA3AF]">{tms.length} total</span>
          </div>

          {/* Add trademark for client */}
          <div className="px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            <p className="text-[12px] text-[#6B7280] mb-2">
              Add trademark for {clientName}
            </p>
            <AddTrademarkForm founderId={clientId} />
          </div>

          {tms.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-2">
              <svg className="mx-auto" width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p className="text-[14px] font-[600] text-[#0A1628]">No trademarks yet</p>
              <p className="text-[13px] text-[#9CA3AF]">
                Add {clientName}&apos;s first trademark above.
              </p>
            </div>
          ) : (
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
                          (new Date(tm.expiration_date).getTime() - today.getTime()) / 86400000
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
                          <span
                            className="inline-flex items-center px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded text-[11px] text-[#9CA3AF]"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {tm.serial_number}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {tm.expiration_date ? (
                            <span
                              className={`text-[13px] font-mono ${
                                isUrgent ? "text-[#DC2626]" : isWarning ? "text-[#D97706]" : "text-[#6B7280]"
                              }`}
                              style={{ fontVariantNumeric: "tabular-nums" }}
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
        </section>

        {/* ── Upcoming Renewals ── */}
        {upcomingRenewals.length > 0 && (
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[14px] font-[600] text-[#0A1628]">Upcoming Renewals</h2>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">Next 90 days</p>
            </div>
            <ul className="divide-y divide-[#F3F4F6]">
              {upcomingRenewals.map((tm) => (
                <li key={tm.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-[500] text-[#0A1628]">{tm.mark_name}</p>
                    <p className="text-[12px] text-[#9CA3AF] font-mono mt-0.5"
                       style={{ fontVariantNumeric: "tabular-nums" }}>
                      {tm.expiration_date}
                    </p>
                  </div>
                  <span
                    className="text-[13px] font-mono font-[500] shrink-0"
                    style={{
                      color: tm.daysLeft < 30 ? "#DC2626" : tm.daysLeft < 60 ? "#D97706" : "#16A34A",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {tm.daysLeft < 0 ? "Expired" : `${tm.daysLeft}d`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </AppShell>
  );
}
