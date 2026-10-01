// src/lib/enrollment/reference-context.tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ReferenceData } from "@/lib/enrollment/load-reference-data";

const ReferenceContext = createContext<ReferenceData | null>(null);

export function ReferenceProvider({
  value,
  children,
}: {
  value: ReferenceData;
  children: ReactNode;
}) {
  return (
    <ReferenceContext.Provider value={value}>
      {children}
    </ReferenceContext.Provider>
  );
}

// Use inside any client component under the provider:
// const { tracks, strands, barangays } = useReference();
export function useReference(): ReferenceData {
  const ctx = useContext(ReferenceContext);
  if (!ctx)
    throw new Error("useReference must be used inside <ReferenceProvider>");
  return ctx;
}
