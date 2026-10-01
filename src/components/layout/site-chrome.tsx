// src/components/layout/site-chrome.tsx
"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin portal pages have their own sidebar layout, so no public header/footer.
  // The login page keeps them.
  const isPortal = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (isPortal) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-secondary">{children}</main>
      <SiteFooter />
    </>
  );
}
