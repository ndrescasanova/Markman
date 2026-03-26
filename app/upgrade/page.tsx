import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UpgradeClient from "./UpgradeClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ subscribed?: string; session_id?: string }>;
}

export default async function UpgradePage({ searchParams }: Props) {
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

  // Attorneys don't have a subscription — send them home
  if (profile?.role === "attorney") redirect("/attorney/dashboard");

  // Check subscription status in DB
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const isActiveInDb = sub?.status === "active";

  // Handle Stripe return: ?subscribed=true&session_id=cs_xxx
  // Webhook may not have fired yet, so we do an optimistic verify
  const params = await searchParams;
  let isSubscribed = isActiveInDb;

  if (params.subscribed === "true" && params.session_id && !isActiveInDb) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover",
      });
      const session = await stripe.checkout.sessions.retrieve(params.session_id);
      if (session.payment_status === "paid") {
        isSubscribed = true;
      }
    } catch {
      // If Stripe verify fails, fall through — show upgrade page
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl text-[#0A1628]">Markman</span>
        <a
          href="/founder/dashboard"
          className="text-sm text-[#6B7280] hover:text-[#0A1628]"
        >
          ← Back to dashboard
        </a>
      </nav>

      <main className="max-w-md mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#0A1628]">
            {isSubscribed ? "Subscription active" : "Protect your brand"}
          </h1>
          {!isSubscribed && (
            <p className="mt-1 text-sm text-[#6B7280]">
              One plan. Everything you need to stay on top of your trademark portfolio.
            </p>
          )}
        </div>

        <UpgradeClient isSubscribed={isSubscribed} />
      </main>
    </div>
  );
}
