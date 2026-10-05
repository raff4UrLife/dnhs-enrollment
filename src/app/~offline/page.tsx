// src/app/~offline/page.tsx
"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-secondary px-6 py-16 text-secondary-foreground">
      <div className="mx-auto max-w-md text-center">
        <WifiOff className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">You are offline</h1>
        <p className="mt-3 text-secondary-foreground/80">
          This page needs an internet connection. Please check your connection
          and try again.
        </p>
        <Button
          size="lg"
          className="mt-6"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </div>
    </section>
  );
}
