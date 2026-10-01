// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavForRole, type Role } from "@/lib/admin/navItems";
import { logout } from "@/lib/auth/logout";

export default function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { main, admin } = getNavForRole(role);

  // Dashboard (/admin) must match exactly, others match by prefix
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive(href)
        ? "bg-primary text-primary-foreground"
        : "text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground",
    );

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-secondary text-secondary-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <Image
          src="/assets/logo.png"
          alt="DNHS seal"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="text-sm font-semibold leading-tight">
          Dimasalang National High School
        </span>
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {main.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon className="size-4" />
            {label}
          </Link>
        ))}

        {admin.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground/50">
              System Settings
            </p>
            {admin.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await logout();
            })
          }
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground/80 transition-colors hover:bg-white/10 hover:text-secondary-foreground disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          {isPending ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
