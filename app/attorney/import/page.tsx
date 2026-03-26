import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BulkImportClient from "./BulkImportClient";

export default async function BulkImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "attorney") redirect("/founder/dashboard");

  // Get client list for the CSV template + validation
  const { data: clientRelations } = await supabase
    .from("attorney_clients")
    .select("users!attorney_clients_client_id_fkey(id, email, display_name)")
    .eq("attorney_id", user.id);

  const clients = (clientRelations ?? []).map(
    (r) => r.users as unknown as { id: string; email: string; display_name: string | null }
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl text-[#0A1628]">Markman</span>
        <a href="/attorney/dashboard" className="text-sm text-[#6B7280] hover:text-[#0A1628]">
          ← Back to dashboard
        </a>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#0A1628]">Bulk Import Trademarks</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Upload a CSV with serial numbers and client emails to add multiple trademarks at once.
          </p>
        </div>
        <BulkImportClient
          clients={clients.map((c) => ({
            email: c.email,
            name: c.display_name || c.email,
          }))}
        />
      </main>
    </div>
  );
}
