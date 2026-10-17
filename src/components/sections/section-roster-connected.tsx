// src/components/sections/section-roster-connected.tsx
"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { updateFinalAverage } from "@/lib/sections/final-average-action";
import { overrideSection } from "@/lib/sections/override-section-action";
import type { RosterData, RosterPermissions } from "@/lib/sections/types";
import { SectionRoster } from "./section-roster";

type Props = {
  data: RosterData;
  permissions: RosterPermissions;
};

// The online version of the roster: SectionRoster plus the real server actions.
// The offline preview uses SectionRoster directly, without these imports.
export function SectionRosterConnected({ data, permissions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // The chosen school year lives in the URL (?schoolyear=<id>), so the page
  // reloads the roster on the server for that year.
  function changeSchoolYear(schoolYearId: string) {
    startTransition(() => {
      router.push(`${pathname}?schoolyear=${encodeURIComponent(schoolYearId)}`);
    });
  }

  return (
    <SectionRoster
      // A new key restarts the picker, search, filter and page for the new year.
      key={data.schoolYearId}
      data={data}
      permissions={permissions}
      onSaveFinalAverage={updateFinalAverage}
      onOverrideSection={overrideSection}
      onSchoolYearChange={changeSchoolYear}
      schoolYearLoading={isPending}
    />
  );
}

// // src/components/sections/section-roster-connected.tsx
// "use client";

// import { updateFinalAverage } from "@/lib/sections/final-average-action";
// import { overrideSection } from "@/lib/sections/override-section-action";
// import type { RosterData, RosterPermissions } from "@/lib/sections/types";
// import { SectionRoster } from "./section-roster";

// type Props = {
//   data: RosterData;
//   permissions: RosterPermissions;
// };

// // The online version of the roster: SectionRoster plus the real server actions.
// // The offline preview uses SectionRoster directly, without these two imports.
// export function SectionRosterConnected({ data, permissions }: Props) {
//   return (
//     <SectionRoster
//       data={data}
//       permissions={permissions}
//       onSaveFinalAverage={updateFinalAverage}
//       onOverrideSection={overrideSection}
//     />
//   );
// }
