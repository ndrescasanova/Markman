import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/markman/AppShell";
import InviteClientButton from "@/components/markman/InviteClientButton";
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

  const { data: acRows } = await supabase
    .from("attorney_clients")
    .select("attorney_id, client_id")
    .or(`attorney_id.eq.${user.id},client_id.eq.${user.id}`);

  const partnerIds = (acRows ?? []).map((r) =>
    r.attorney_id === user.id ? r.client_id : r.attorney_id
  );

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

  const role = profile?.role === "attorney" ? "attorney" : "founder";
  const userDisplay = profile?.display_name || profile?.email || "";

  return (
    <AppShell
      role={role}
      userDisplay={userDisplay}
      sidebarAction={role === "attorney" ? <InviteClientButton /> : undefined}
    >
      <div className="h-full flex flex-col">
        {/* Page header */}
        <div className="px-8 py-6 border-b border-[#E5E7EB]">
          <h1 className="text-[20px] font-[600] text-[#0A1628] tracking-tight">Messages</h1>
        </div>

        {/* Messages content */}
        <div className="flex-1 px-8 py-6 overflow-hidden">
          <MessagesClient
            currentUser={{
              id: user.id,
              displayName: profile?.display_name || profile?.email || "",
            }}
            partners={partners.map((p) => ({
              id: p.id,
              displayName: p.display_name || p.email,
            }))}
          />
        </div>
      </div>
    </AppShell>
  );
}
