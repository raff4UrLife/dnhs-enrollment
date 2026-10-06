// src/app/~offline/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readOfflineSession } from "@/lib/offline/cache";

export default function OfflinePage() {
  // True only when this computer has a valid saved sign-in for admin or staff
  const [canWalkIn, setCanWalkIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await readOfflineSession();
      if (cancelled) return;
      setCanWalkIn(!!session && session.role !== "teacher");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-secondary px-6 py-16 text-secondary-foreground">
      <div className="mx-auto max-w-md text-center">
        <WifiOff className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">You are offline</h1>
        <p className="mt-3 text-secondary-foreground/80">
          This page needs an internet connection. Please check your connection
          and try again.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Button size="lg" onClick={() => window.location.reload()}>
            Try again
          </Button>

          {canWalkIn && (
            <Link
              href="/offline-walk-in"
              prefetch={false}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-primary px-6 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary/10"
            >
              <ClipboardList className="size-4" />
              Encode a walk-in offline
            </Link>
          )}
        </div>

        {canWalkIn && (
          <p className="mt-3 text-sm text-secondary-foreground/70">
            Walk-ins are saved on this computer and sent when the internet
            returns.
          </p>
        )}
      </div>
    </section>
  );
}

// // src/app/~offline/page.tsx
// "use client";

// import { WifiOff } from "lucide-react";
// import { Button } from "@/components/ui/button";

// export default function OfflinePage() {
//   return (
//     <section className="flex min-h-[60vh] items-center justify-center bg-secondary px-6 py-16 text-secondary-foreground">
//       <div className="mx-auto max-w-md text-center">
//         <WifiOff className="mx-auto h-14 w-14 text-primary" />
//         <h1 className="mt-4 text-2xl font-semibold">You are offline</h1>
//         <p className="mt-3 text-secondary-foreground/80">
//           This page needs an internet connection. Please check your connection
//           and try again.
//         </p>
//         <Button
//           size="lg"
//           className="mt-6"
//           onClick={() => window.location.reload()}
//         >
//           Try again
//         </Button>
//       </div>
//     </section>
//   );
// }
