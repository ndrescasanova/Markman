import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeBrandHealthScore } from "@/lib/brand-health/score";
import { ScoreGauge } from "@/components/markman/ScoreGauge";
import { StatusBadge } from "@/components/markman/StatusBadge";
import { AddTrademarkForm } from "@/components/markman/AddTrademarkForm";
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl text-[#0A1628]">Markman</span>
        <div className="flex items-center gap-4">
          <Link href="/messages" className="text-sm text-[#6B7280] hover:text-[#0A1628]">
            Messages
          </Link>
          <span className="text-sm text-[#9CA3AF]">
            {profile?.display_name || profile?.email}
          </span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Score Hero Strip */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col items-center">
          <ScoreGauge score={score} />
          {score !== null && (
            <p className="mt-2 text-xs text-[#9CA3AF]">
              Based on {tms.length} trademark{tms.length !== 1 ? "s" : ""} in your portfolio
            </p>
          )}
          {/* TODO-004: legal framing — "not legal advice" */}
          <p className="mt-1 text-xs text-[#9CA3AF]">
            This score reflects renewal status and registration data. Not legal advice.
          </p>
        </section>

        {/* Two-column: Marks Table + Renewal Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Registered Marks Table */}
          <section className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0A1628]">Your Trademarks</h2>
              <span className="text-xs text-[#9CA3AF]">{tms.length} total</span>
            </div>

            {tms.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-[#0A1628] mb-1">
                  No trademarks yet
                </p>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Add a trademark by entering its USPTO serial number below.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                        Mark
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                        Serial #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                        Expiry
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {tms.map((tm) => (
                      <tr key={tm.id} className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 text-[#0A1628] font-medium">{tm.mark_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">
                          {tm.serial_number}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tm.status} />
                          {tm.sync_status === "error" && (
                            <span className="ml-1 text-xs text-[#D97706]" title={tm.sync_error ?? ""}>
                              ⚠
                            </span>
                          )}
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

            {/* Add trademark form */}
            <div className="px-6 py-4 border-t border-[#E5E7EB]">
              <AddTrademarkForm />
            </div>
          </section>

          {/* Renewal Timeline */}
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#0A1628]">Renewal Timeline</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Next 90 days</p>
            </div>

            {urgentMarks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-[#9CA3AF]">
                  {tms.length === 0
                    ? "Add trademarks to track renewal deadlines"
                    : "No renewals due in the next 90 days"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {urgentMarks.map((tm) => {
                  const urgencyColor =
                    tm.daysLeft < 30
                      ? "text-[#DC2626]"
                      : tm.daysLeft < 60
                      ? "text-[#D97706]"
                      : "text-[#16A34A]";
                  return (
                    <li key={tm.id} className="px-4 py-3">
                      <p className="text-xs font-medium text-[#0A1628]">{tm.mark_name}</p>
                      <p className={`text-xs mt-0.5 ${urgencyColor}`}>
                        {tm.daysLeft < 0
                          ? "Expired"
                          : tm.daysLeft === 0
                          ? "Expires today"
                          : `${tm.daysLeft} days left`}
                      </p>
                      <p className="text-xs text-[#9CA3AF] font-mono">{tm.expiration_date}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Attorney Contact Strip */}
        {attorneyInfo && (
          <section className="bg-white border border-[#E5E7EB] rounded-lg px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0A1628]">Your Attorney</p>
              <p className="text-xs text-[#6B7280]">
                {attorneyInfo.display_name || attorneyInfo.email}
              </p>
            </div>
            <Link
              href="/messages"
              className="px-3 py-1.5 text-sm text-[#2563EB] border border-[#2563EB] rounded-md hover:bg-[#EFF6FF] transition-colors"
            >
              Send message
            </Link>
          </section>
        )}

        {/* Phase 2 locked card */}
        <section className="bg-white border border-[#E5E7EB] rounded-lg px-6 py-5 opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-[#0A1628]">Conflict Monitoring</h2>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#F3F4F6] text-[#6B7280] rounded uppercase tracking-wide">
              Coming soon
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            AI-powered conflict detection will alert you when new trademark filings
            could infringe on your brand. Launching in Phase 2.
          </p>
        </section>
      </main>
    </div>
  );
}
