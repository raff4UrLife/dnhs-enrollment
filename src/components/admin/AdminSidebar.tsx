// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useState,
  useTransition,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { LogOut, Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavForRole, type Role } from "@/lib/admin/navItems";
import { logout } from "@/lib/auth/logout";
import { clearOfflineSession } from "@/lib/offline/cache";

// The label shown beside a collapsed icon, and where it sits on screen.
type Tip = { label: string; top: number };
type HoverEvent = MouseEvent<HTMLElement> | FocusEvent<HTMLElement>;

// Sidebar is w-16 (64px) when collapsed; the label sits 12px past its edge.
const TIP_LEFT = 76;

export default function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const { main, admin } = getNavForRole(role);
  const items = [...main, ...admin];

  // Dashboard (/admin) must match exactly, others match by prefix
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isCollapsed && "justify-center px-0",
      isActive(href)
        ? "bg-primary text-primary-foreground"
        : "text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground",
    );

  // One tooltip for the whole sidebar. It is position: fixed, so the nav's
  // scrolling area cannot clip it.
  function showTip(event: HoverEvent, label: string) {
    if (!isCollapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTip({ label, top: rect.top + rect.height / 2 });
  }

  function hideTip() {
    setTip(null);
  }

  function toggleCollapsed() {
    setTip(null);
    setIsCollapsed((value) => !value);
  }

  function handleLogout() {
    startTransition(async () => {
      if (role === "admin" || role === "staff") {
        await clearOfflineSession();
      }
      await logout();
    });
  }

  const logoutLabel = isPending ? "Logging out..." : "Logout";

  return (
    <aside
      className={cn(
        "sticky top-0 z-50 flex h-screen shrink-0 flex-col bg-secondary text-secondary-foreground transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Brand & Toggle */}
      <div
        className={cn(
          "flex items-center border-b border-white/10 px-4 py-5",
          isCollapsed ? "justify-center px-2" : "justify-between",
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <Image
              src="/assets/logo.png"
              alt="DNHS seal"
              width={40}
              height={40}
              className="shrink-0 rounded-full"
            />
            <span className="text-sm font-semibold leading-tight">
              Dimasalang National High School
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1.5 text-secondary-foreground/80 transition-colors hover:bg-white/10 hover:text-secondary-foreground"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={linkClass(href)}
            onMouseEnter={(event) => showTip(event, label)}
            onMouseLeave={hideTip}
            onFocus={(event) => showTip(event, label)}
            onBlur={hideTip}
          >
            <Icon className="size-4 shrink-0" />
            {!isCollapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleLogout}
          aria-label={logoutLabel}
          onMouseEnter={(event) => showTip(event, logoutLabel)}
          onMouseLeave={hideTip}
          onFocus={(event) => showTip(event, logoutLabel)}
          onBlur={hideTip}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground/80 transition-colors hover:bg-white/10 hover:text-secondary-foreground disabled:opacity-70",
            isCollapsed && "justify-center px-0",
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <LogOut className="size-4 shrink-0" />
          )}
          {!isCollapsed && <span>{logoutLabel}</span>}
        </button>
      </div>

      {/* Hover label for collapsed mode */}
      {isCollapsed && tip && (
        <div
          role="tooltip"
          style={{ top: tip.top, left: TIP_LEFT }}
          className="pointer-events-none fixed z-100 -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-white/20"
        >
          {tip.label}
        </div>
      )}
    </aside>
  );
}
