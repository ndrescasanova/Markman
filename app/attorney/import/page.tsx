import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/markman/AppShell";
import InviteClientButton from "@/components/markman/InviteClientButton";
import BulkImportClient from "./BulkImportClient";

export default async function BulkImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "attorney") redirect("/founder/dashboard");

  const { data: clientRelations } = await supabase
    .from("attorney_clients")
    .select("users!attorney_clients_client_id_fkey(id, email, display_name)")
    .eq("attorney_id", user.id);

  const clients = (clientRelations ?? []).map(
    (r) => r.users as unknown as { id: string; email: string; display_name: string | null }
  );

  const userDisplay = profile?.display_name || profile?.email || "";

  return (
    <AppShell
      role="attorney"
      userDisplay={userDisplay}
      sidebarAction={<InviteClientButton />}
    >
      <div className="px-8 py-8 max-w-[760px]">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-[500] tracking-[0.08em] uppercase text-[#8C7355] mb-2">
            Bulk Import
          </p>
          <h1 className="text-[22px] font-[600] text-[#0A1628] tracking-tight">
            Import Trademarks
          </h1>
          <p className="mt-1.5 text-[14px] text-[#6B7280]">
            Upload a CSV with serial numbers and client emails to add multiple trademarks at once.
          </p>
        </div>

        <BulkImportClient
          clients={clients.map((c) => ({
            email: c.email,
            name: c.display_name || c.email,
          }))}
        />
      </div>
    </AppShell>
  );
}
