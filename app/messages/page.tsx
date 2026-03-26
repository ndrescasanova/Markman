import { createClient } from "@/lib/supabase/server";
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

  // Fetch conversation partners
  let partnersQuery;
  if (profile?.role === "attorney") {
    partnersQuery = supabase
      .from("attorney_clients")
      .select("users!attorney_clients_client_id_fkey(id, display_name, email)")
      .eq("attorney_id", user.id);
  } else {
    partnersQuery = supabase
      .from("attorney_clients")
      .select("users!attorney_clients_attorney_id_fkey(id, display_name, email)")
      .eq("client_id", user.id);
  }

  const { data: partnerRelations } = await partnersQuery;
  const partners = (partnerRelations ?? []).map(
    (r) => (profile?.role === "attorney" ? r.users : r.users) as unknown as {
      id: string;
      display_name: string | null;
      email: string;
    }
  );

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
