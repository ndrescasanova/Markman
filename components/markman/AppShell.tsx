"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const FOUNDER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/founder/dashboard" },
  { label: "Messages", href: "/messages" },
];

const ATTORNEY_NAV: NavItem[] = [
  { label: "Overview", href: "/attorney/dashboard" },
  { label: "Messages", href: "/messages" },
  { label: "Bulk Import", href: "/attorney/import" },
];

interface Props {
  role: "founder" | "attorney";
  userDisplay: string;
  children: React.ReactNode;
  /** Optional slot in sidebar bottom — e.g. InviteClientButton */
  sidebarAction?: React.ReactNode;
}

export function AppShell({ role, userDisplay, children, sidebarAction }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const navItems = role === "founder" ? FOUNDER_NAV : ATTORNEY_NAV;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-[240px] shrink-0 flex flex-col border-r border-[#E5E7EB] bg-[#FAFAFA] h-screen sticky top-0">

        {/* Wordmark */}
        <div className="px-6 pt-8 pb-7">
          <Link
            href={role === "attorney" ? "/attorney/dashboard" : "/founder/dashboard"}
            className="no-underline"
          >
            <span className="font-serif text-[21px] tracking-[-0.01em] text-[#0A1628] leading-none">
              Markman
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4">
          <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
            {navItems.map((item) => {
              // Exact match for top-level routes; prefix match for nested routes
              const isActive =
                pathname === item.href ||
                (item.href.length > 1 &&
                  pathname.startsWith(item.href + "/") &&
                  item.href !== "/messages");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "block py-[7px] text-[13.5px] border-l-[2px] pl-3 transition-colors duration-75 no-underline",
                      isActive
                        ? "border-[#2563EB] text-[#2563EB] font-[500]"
                        : "border-transparent text-[#374151] font-normal hover:text-[#0A1628]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: action + user + sign out */}
        <div className="px-4 pb-7 space-y-4">
          {sidebarAction && (
            <div>{sidebarAction}</div>
          )}
          <div className="space-y-2">
            <p className="text-[11px] text-[#9CA3AF] truncate">{userDisplay}</p>
            <button
              onClick={handleSignOut}
              className="text-[13px] text-[#6B7280] hover:text-[#0A1628] transition-colors font-normal bg-transparent border-0 p-0 cursor-pointer font-sans"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
