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

  // The offline walk-in page is a standalone screen for office PCs without
  // internet, so it also skips the public header/footer.
  const isOfflineWalkIn = pathname.startsWith("/offline-walk-in");

  if (isPortal || isOfflineWalkIn) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-secondary">{children}</main>
      <SiteFooter />
    </>
  );
}

// // src/components/layout/site-chrome.tsx
// "use client";

// import { usePathname } from "next/navigation";
// import { SiteHeader } from "@/components/layout/site-header";
// import { SiteFooter } from "@/components/layout/site-footer";

// export function SiteChrome({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();

//   // Admin portal pages have their own sidebar layout, so no public header/footer.
//   // The login page keeps them.
//   const isPortal = pathname.startsWith("/admin") && pathname !== "/admin/login";

//   if (isPortal) return <>{children}</>;

//   return (
//     <>
//       <SiteHeader />
//       <main className="flex-1 bg-secondary">{children}</main>
//       <SiteFooter />
//     </>
//   );
// }
