import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeBrandHealthScore, type TrademarkStatus } from "@/lib/brand-health/score";
import { AppShell } from "@/components/markman/AppShell";
import InviteClientButton from "@/components/markman/InviteClientButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AttorneyDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "attorney") redirect("/founder/dashboard");

  // Fetch all clients for this attorney
  const { data: clientRelations } = await supabase
    .from("attorney_clients")
    .select("client_id, users!attorney_clients_client_id_fkey(id, email, display_name)")
    .eq("attorney_id", user.id)
    .order("created_at", { ascending: false });

  const clients = (clientRelations ?? []).map(
    (r) => r.users as unknown as { id: string; email: string; display_name: string | null }
  );
  const clientIds = clients.map((c) => c.id);

  // Batch-fetch all trademarks
  const { data: allTrademarks } = clientIds.length
    ? await supabase
        .from("trademarks")
        .select("user_id, id, mark_name, serial_number, status, expiration_date")
        .in("user_id", clientIds)
    : { data: [] };

  // Batch-fetch most recent score per client
  const { data: latestScores } = clientIds.length
    ? await supabase
        .from("score_history")
        .select("user_id, score, computed_at")
        .in("user_id", clientIds)
        .order("computed_at", { ascending: false })
    : { data: [] };

  type TmRow = {
    user_id: string; id: string; mark_name: string;
    serial_number: string; status: TrademarkStatus; expiration_date: string | null;
  };

  const today = new Date();
  const tmsByClient = new Map<string, TmRow[]>();
  for (const tm of allTrademarks ?? []) {
    if (!tmsByClient.has(tm.user_id)) tmsByClient.set(tm.user_id, []);
    tmsByClient.get(tm.user_id)!.push(tm as TmRow);
  }

  const scoreByClient = new Map<string, number | null>();
  for (const s of latestScores ?? []) {
    if (!scoreByClient.has(s.user_id)) scoreByClient.set(s.user_id, s.score);
  }

  const clientSummaries = clients.map((client) => {
    const tms = tmsByClient.get(client.id) ?? [];
    const score =
      scoreByClient.has(client.id)
        ? scoreByClient.get(client.id)!
        : computeBrandHealthScore(
            tms.map((t) => ({ status: t.status, expiration_date: t.expiration_date }))
          );

    const urgentCount = tms.filter((t) => {
      if (!t.expiration_date) return false;
      const days = Math.floor(
        (new Date(t.expiration_date).getTime() - today.getTime()) / 86400000
      );
      return days < 30;
    }).length;

    const urgency: "critical" | "warning" | "ok" =
      urgentCount > 0 || (score !== null && score < 50)
        ? "critical"
        : score !== null && score < 70
        ? "warning"
        : "ok";

    return { ...client, tms, score, urgentCount, urgency };
  });

  const totalMarks = (allTrademarks ?? []).length;
  const urgentTotal = clientSummaries.filter((c) => c.urgency === "critical").length;

  // All upcoming deadlines across all clients (next 90 days)
  const allDeadlines = (allTrademarks ?? [])
    .filter((t) => t.expiration_date)
    .map((t) => {
      const daysLeft = Math.floor(
        (new Date(t.expiration_date!).getTime() - today.getTime()) / 86400000
      );
      const client = clients.find((c) => c.id === t.user_id);
      return { ...t, daysLeft, clientName: client?.display_name || client?.email || "" };
    })
    .filter((t) => t.daysLeft < 90)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10);

  const userDisplay = profile?.display_name || profile?.email || "";

  return (
    <AppShell
      role="attorney"
      userDisplay={userDisplay}
      sidebarAction={<InviteClientButton />}
    >
      <div className="px-8 py-8 space-y-6 max-w-[960px]">

        {/* ── Stat Cards ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Clients",
              value: clients.length,
              bg: "bg-white",
              valueColor: "text-[#0A1628]",
            },
            {
              label: "Urgent",
              value: urgentTotal,
              bg: urgentTotal > 0 ? "bg-[#FEF2F2]" : "bg-white",
              valueColor: urgentTotal > 0 ? "text-[#DC2626]" : "text-[#0A1628]",
            },
            {
              label: "Total Marks",
              value: totalMarks,
              bg: "bg-white",
              valueColor: "text-[#0A1628]",
            },
            {
              label: "Conflicts",
              value: 0,
              bg: "bg-white",
              valueColor: "text-[#9CA3AF]",
            },
          ].map(({ label, value, bg, valueColor }) => (
            <div
              key={label}
              className={`${bg} border border-[#E5E7EB] rounded-lg px-5 py-4`}
            >
              <p className="text-[11px] font-[500] tracking-[0.06em] uppercase text-[#6B7280] mb-2">
                {label}
              </p>
              <p className={`text-[28px] font-mono font-[400] leading-none ${valueColor}`}
                 style={{ fontVariantNumeric: "tabular-nums" }}>
                {value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Client List ── */}
          <section className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-[14px] font-[600] text-[#0A1628]">Clients</h2>
              <span className="text-[12px] text-[#9CA3AF]">
                {clients.length} total
              </span>
            </div>

            {clients.length === 0 ? (
              <div className="px-6 py-16 text-center space-y-3">
                {/* Briefcase icon */}
                <svg className="mx-auto" width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  <line x1="12" y1="12" x2="12" y2="12" />
                  <path d="M2 12h20" />
                </svg>
                <p className="text-[14px] font-[600] text-[#0A1628]">No clients yet</p>
                <p className="text-[13px] text-[#9CA3AF] max-w-xs mx-auto">
                  Invite a founder to connect their trademark portfolio to your dashboard.
                </p>
                <Link
                  href="/attorney/import"
                  className="inline-block mt-1 text-[13px] text-[#2563EB] hover:underline"
                >
                  Or use bulk import →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {clientSummaries.map((client) => (
                  <li
                    key={client.id}
                    className="px-6 py-4 hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Client info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-[500] text-[#0A1628]">
                            {client.display_name || client.email}
                          </span>
                          {client.urgency === "critical" && (
                            <span className="text-[12px] text-[#DC2626] font-[500]">
                              {client.urgentCount} renewal{client.urgentCount !== 1 ? "s" : ""} due
                            </span>
                          )}
                          {client.urgency === "warning" && (
                            <span className="text-[12px] text-[#D97706]">Score at risk</span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                          {client.tms.length} trademark{client.tms.length !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Score + view */}
                      <div className="flex items-center gap-4 shrink-0">
                        {client.score !== null && (
                          <span
                            className="font-mono text-[14px]"
                            style={{
                              color:
                                client.score >= 60
                                  ? "#16A34A"
                                  : client.score >= 40
                                  ? "#D97706"
                                  : "#DC2626",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {client.score}
                          </span>
                        )}
                        <Link
                          href={`/attorney/client/${client.id}`}
                          className="text-[13px] text-[#2563EB] hover:underline font-[500]"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {clients.length > 0 && (
              <div className="px-6 py-3 border-t border-[#F3F4F6] bg-[#F9FAFB]">
                <p className="text-[11px] text-[#9CA3AF]">
                  Free plan · {clients.length} client{clients.length !== 1 ? "s" : ""} — no limit
                </p>
              </div>
            )}
          </section>

          {/* ── Upcoming Renewals ── */}
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[14px] font-[600] text-[#0A1628]">Upcoming Renewals</h2>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">All clients · next 90 days</p>
            </div>

            {allDeadlines.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] text-[#9CA3AF]">No renewals due in the next 90 days</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {allDeadlines.map((tm) => (
                  <li key={tm.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-[500] text-[#0A1628] truncate">
                          {tm.mark_name}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF] truncate">{tm.clientName}</p>
                      </div>
                      <span
                        className="text-[12px] font-mono shrink-0"
                        style={{
                          color:
                            tm.daysLeft < 30
                              ? "#DC2626"
                              : tm.daysLeft < 60
                              ? "#D97706"
                              : "#16A34A",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {tm.daysLeft}d
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
