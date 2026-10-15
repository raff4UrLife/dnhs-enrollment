// src/components/sections/section-roster-connected.tsx
"use client";

import { updateFinalAverage } from "@/lib/sections/final-average-action";
import { overrideSection } from "@/lib/sections/override-section-action";
import type { RosterData, RosterPermissions } from "@/lib/sections/types";
import { SectionRoster } from "./section-roster";

type Props = {
  data: RosterData;
  permissions: RosterPermissions;
};

// The online version of the roster: SectionRoster plus the real server actions.
// The offline preview uses SectionRoster directly, without these two imports.
export function SectionRosterConnected({ data, permissions }: Props) {
  return (
    <SectionRoster
      data={data}
      permissions={permissions}
      onSaveFinalAverage={updateFinalAverage}
      onOverrideSection={overrideSection}
    />
  );
}
