// src/components/offline/offline-header.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { readOfflineSession } from "@/lib/offline/cache";
import { useOnline } from "@/lib/offline/use-online";

type OfflineHeaderProps = {
  // Width of the content, so the header lines up with the page under it.
  widthClass?: string;
};

type FeatureLink = {
  href: string;
  label: string;
  adminStaffOnly?: boolean; // offline walk-in is not for teachers
};

const FEATURES: FeatureLink[] = [
  { href: "/offline-walk-in", label: "Home", adminStaffOnly: true },
  { href: "/offline-sections", label: "Section Rosters" },
];

// Top bar shared by every offline page: feature links on the left, the center
// left clean, connection status on the right.
export function OfflineHeader({
  widthClass = "max-w-5xl",
}: OfflineHeaderProps) {
  const online = useOnline();
  const pathname = usePathname();
  const [isTeacher, setIsTeacher] = useState(false);

  // The saved sign-in note tells us the role, even without internet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await readOfflineSession();
      if (!cancelled) setIsTeacher(session?.role === "teacher");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const links = FEATURES.filter((f) => !(f.adminStaffOnly && isTeacher));

  return (
    <header className="bg-secondary text-secondary-foreground">
      <div
        className={cn(
          "mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3",
          widthClass,
        )}
      >
        {/* Plain <a> on purpose: a full page load that the service worker can
            answer from its cache when there is no internet. */}
        <nav aria-label="Offline features" className="flex flex-wrap gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-white/15 font-semibold"
                    : "opacity-80 hover:bg-white/10 hover:opacity-100",
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              online ? "bg-green-600/20" : "bg-primary/20",
            )}
          >
            {online ? (
              <Wifi className="size-3.5" />
            ) : (
              <WifiOff className="size-3.5" />
            )}
            {online ? "Online" : "Offline"}
          </span>

          {online && (
            <a
              href="/admin"
              className="text-sm underline underline-offset-4 hover:opacity-80"
            >
              Back to admin
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
