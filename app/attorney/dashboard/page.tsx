import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeBrandHealthScore, type TrademarkStatus } from "@/lib/brand-health/score";
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

  // Batch-fetch all trademarks (no N+1 — MEDIUM-2)
  const { data: allTrademarks } = clientIds.length
    ? await supabase
        .from("trademarks")
        .select("user_id, id, mark_name, serial_number, status, expiration_date")
        .in("user_id", clientIds)
    : { data: [] };

  // Batch-fetch most recent score per client (no N+1)
  const { data: latestScores } = clientIds.length
    ? await supabase
        .from("score_history")
        .select("user_id, score, computed_at")
        .in("user_id", clientIds)
        .order("computed_at", { ascending: false })
    : { data: [] };

  type TmRow = { user_id: string; id: string; mark_name: string; serial_number: string; status: TrademarkStatus; expiration_date: string | null };

  // Build client summaries
  const today = new Date();
  const tmsByClient = new Map<string, TmRow[]>();
  for (const tm of allTrademarks ?? []) {
    if (!tmsByClient.has(tm.user_id)) tmsByClient.set(tm.user_id, []);
    tmsByClient.get(tm.user_id)!.push(tm as TmRow);
  }

  // Get most recent score per client (scores are ordered desc already)
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
        : (score !== null && score < 70)
        ? "warning"
        : "ok";

    return { ...client, tms, score, urgentCount, urgency };
  });

  // Summary stats
  const totalMarks = (allTrademarks ?? []).length;
  const urgentTotal = clientSummaries.filter((c) => c.urgency === "critical").length;

  // All upcoming deadlines across all clients
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl text-[#0A1628]">Markman</span>
        <div className="flex items-center gap-4">
          <Link href="/messages" className="text-sm text-[#6B7280] hover:text-[#0A1628]">
            Messages
          </Link>
          <Link
            href="/attorney/import"
            className="px-3 py-1.5 text-sm bg-[#2563EB] text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Bulk import
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stat cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Clients", value: clients.length, color: "text-[#0A1628]" },
            {
              label: "Urgent",
              value: urgentTotal,
              color: urgentTotal > 0 ? "text-[#DC2626]" : "text-[#16A34A]",
            },
            { label: "Total Marks", value: totalMarks, color: "text-[#0A1628]" },
            { label: "Conflicts", value: 0, color: "text-[#9CA3AF]" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white border border-[#E5E7EB] rounded-lg px-5 py-4"
            >
              <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wide mb-1">
                {label}
              </p>
              <p className={`text-2xl font-mono font-medium ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client list */}
          <section className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0A1628]">Clients</h2>
              <InviteClientButton />
            </div>

            {clients.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-[#0A1628] mb-1">No clients yet</p>
                <p className="text-xs text-[#9CA3AF] mb-4">
                  Invite your first client to get started.
                </p>
                <Link
                  href="/attorney/import"
                  className="text-sm text-[#2563EB] hover:underline"
                >
                  Or use bulk import →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {clientSummaries.map((client) => (
                  <li
                    key={client.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0A1628]">
                          {client.display_name || client.email}
                        </span>
                        {client.urgency === "critical" && (
                          <span className="text-xs text-[#DC2626]">
                            {client.urgentCount} renewal{client.urgentCount !== 1 ? "s" : ""} due
                          </span>
                        )}
                        {client.urgency === "warning" && (
                          <span className="text-xs text-[#D97706]">Score at risk</span>
                        )}
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {client.tms.length} trademark{client.tms.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {client.score !== null && (
                        <span
                          className={`font-mono text-sm ${
                            client.score >= 70
                              ? "text-[#16A34A]"
                              : client.score >= 50
                              ? "text-[#D97706]"
                              : "text-[#DC2626]"
                          }`}
                        >
                          {client.score}
                        </span>
                      )}
                      <Link
                        href={`/attorney/client/${client.id}`}
                        className="text-xs text-[#2563EB] hover:underline"
                      >
                        View →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {/* Free plan footer */}
            <div className="px-6 py-3 border-t border-[#F3F4F6] bg-[#F9FAFB]">
              <p className="text-xs text-[#9CA3AF]">
                Free plan · {clients.length} client{clients.length !== 1 ? "s" : ""} — no limit
              </p>
            </div>
          </section>

          {/* Weekly deadline view */}
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#0A1628]">Upcoming Renewals</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">All clients · next 90 days</p>
            </div>

            {allDeadlines.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-[#9CA3AF]">No renewals due in the next 90 days</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {allDeadlines.map((tm) => (
                  <li key={tm.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#0A1628]">{tm.mark_name}</p>
                        <p className="text-xs text-[#9CA3AF]">{tm.clientName}</p>
                      </div>
                      <span
                        className={`text-xs font-mono ${
                          tm.daysLeft < 30
                            ? "text-[#DC2626]"
                            : tm.daysLeft < 60
                            ? "text-[#D97706]"
                            : "text-[#16A34A]"
                        }`}
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
      </main>
    </div>
  );
}
