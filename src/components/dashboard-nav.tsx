import Link from "next/link";
import type { UserRole } from "@/lib/auth/jwt";

type NavItem = { href: string; label: string; roles: UserRole[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/chatter", label: "Focus", roles: ["CHATTER", "ADMIN", "MANAGER"] },
  { href: "/dashboard/qc", label: "QC", roles: ["QC", "MANAGER", "ADMIN"] },
  { href: "/dashboard/creator", label: "Creator", roles: ["CREATOR_VIEW", "ADMIN", "MANAGER"] },
  { href: "/dashboard/admin", label: "Admin", roles: ["ADMIN", "MANAGER"] },
  { href: "/dashboard/integrations", label: "Integrations", roles: ["ADMIN", "MANAGER"] },
  { href: "/dashboard/team", label: "Team", roles: ["ADMIN", "MANAGER"] },
  { href: "/dashboard", label: "Overview", roles: ["ADMIN", "MANAGER", "QC", "CHATTER", "CREATOR_VIEW"] },
  { href: "/dashboard/super-admin", label: "Super Admin", roles: ["ADMIN"] },
];

export function DashboardNav({ role, email }: { role: UserRole; email: string }) {
  const visible = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            OmniOFM CRM
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{email}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-700 hover:underline dark:text-zinc-200"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/" className="text-zinc-700 hover:underline dark:text-zinc-200">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}