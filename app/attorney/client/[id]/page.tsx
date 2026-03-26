import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeBrandHealthScore } from "@/lib/brand-health/score";
import { StatusBadge } from "@/components/markman/StatusBadge";
import { ScoreGauge } from "@/components/markman/ScoreGauge";
import { AddTrademarkForm } from "@/components/markman/AddTrademarkForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
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

  // Fetch client profile + trademarks + score history in parallel
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl text-[#0A1628]">Markman</span>
        <Link
          href="/attorney/dashboard"
          className="text-sm text-[#6B7280] hover:text-[#0A1628]"
        >
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#0A1628]">{clientName}</h1>
            {client?.display_name && (
              <p className="text-sm text-[#6B7280]">{client.email}</p>
            )}
          </div>
          <Link
            href="/messages"
            className="px-3 py-1.5 text-sm text-[#2563EB] border border-[#2563EB] rounded-md hover:bg-[#EFF6FF] transition-colors"
          >
            Send message
          </Link>
        </div>

        {/* Score + Stats strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col items-center">
            <ScoreGauge score={score} />
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {tms.length} trademark{tms.length !== 1 ? "s" : ""}
            </p>
          </section>

          {/* Score history */}
          <section className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#0A1628]">Score History</h2>
            </div>
            {!scores || scores.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-[#9CA3AF]">No score history yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F9FAFB]">
                    <tr>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">
                        Date
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {scores.map((s, i) => (
                      <tr key={i}>
                        <td className="px-5 py-2.5 text-xs text-[#6B7280] font-mono">
                          {new Date(s.computed_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`font-mono text-sm ${
                              s.score >= 70
                                ? "text-[#16A34A]"
                                : s.score >= 50
                                ? "text-[#D97706]"
                                : "text-[#DC2626]"
                            }`}
                          >
                            {s.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Trademarks */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0A1628]">Trademarks</h2>
            <span className="text-xs text-[#9CA3AF]">{tms.length} total</span>
          </div>

          {/* Attorney can add trademarks on behalf of this client */}
          <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFAFA]">
            <AddTrademarkForm founderId={clientId} />
          </div>

          {tms.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-[#0A1628] mb-1">No trademarks yet</p>
              <p className="text-xs text-[#9CA3AF]">Add a trademark below to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">
                      Mark
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">
                      Serial
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase">
                      Expiry
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {tms.map((tm) => (
                    <tr key={tm.id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3 font-medium text-[#0A1628]">
                        {tm.mark_name}
                        {tm.sync_status === "error" && (
                          <span
                            className="ml-1 text-xs text-[#D97706]"
                            title={tm.sync_error ?? ""}
                          >
                            ⚠
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">
                        {tm.serial_number}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tm.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">
                        {tm.expiration_date ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Upcoming renewals */}
        {upcomingRenewals.length > 0 && (
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#0A1628]">Upcoming Renewals</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Next 90 days</p>
            </div>
            <ul className="divide-y divide-[#F3F4F6]">
              {upcomingRenewals.map((tm) => (
                <li key={tm.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">{tm.mark_name}</p>
                    <p className="text-xs text-[#9CA3AF] font-mono">{tm.expiration_date}</p>
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
                    {tm.daysLeft < 0 ? "Expired" : `${tm.daysLeft}d`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
