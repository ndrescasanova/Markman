import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  // Step 1: get partner IDs from attorney_clients (RLS allows: attorney_id = uid OR client_id = uid)
  const { data: acRows } = await supabase
    .from("attorney_clients")
    .select("attorney_id, client_id")
    .or(`attorney_id.eq.${user.id},client_id.eq.${user.id}`);

  const partnerIds = (acRows ?? []).map((r) =>
    r.attorney_id === user.id ? r.client_id : r.attorney_id
  );

  // Step 2: fetch partner profiles using admin client (bypasses RLS — server-only)
  const admin = createAdminClient();
  const { data: partnerUsers } = partnerIds.length
    ? await admin
        .from("users")
        .select("id, display_name, email")
        .in("id", partnerIds)
    : { data: [] };

  const partners = (partnerUsers ?? []) as {
    id: string;
    display_name: string | null;
    email: string;
  }[];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <span className="font-serif text-xl text-[#0A1628]">Markman</span>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <MessagesClient
          currentUser={{ id: user.id, displayName: profile?.display_name || profile?.email || "" }}
          partners={partners.map((p) => ({
            id: p.id,
            displayName: p.display_name || p.email,
          }))}
        />
      </main>
    </div>
  );
}
