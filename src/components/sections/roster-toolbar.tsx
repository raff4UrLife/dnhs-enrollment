// src/components/sections/roster-toolbar.tsx
"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RosterSchoolYear } from "@/lib/sections/types";

type RosterToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  missingOnly: boolean;
  onMissingOnlyChange: (value: boolean) => void;
  // How many learners in the current view have no final average yet.
  missingCount: number;
  // Teachers don't enter final averages, so they don't need this filter.
  showMissingFilter: boolean;
  // School year dropdown. Hidden when the list or the handler is missing
  // (for example in the offline preview).
  schoolYears?: RosterSchoolYear[];
  schoolYearId?: string;
  onSchoolYearChange?: (schoolYearId: string) => void;
  schoolYearDisabled?: boolean; // true while the new year is loading
};

// Search and filter for the roster. The parent owns both values (plain state),
// and the list is filtered locally, so it also works in the offline preview.
export function RosterToolbar({
  search,
  onSearchChange,
  missingOnly,
  onMissingOnlyChange,
  missingCount,
  showMissingFilter,
  schoolYears,
  schoolYearId,
  onSchoolYearChange,
  schoolYearDisabled = false,
}: RosterToolbarProps) {
  const showSchoolYear =
    !!schoolYears && schoolYears.length > 0 && !!onSchoolYearChange;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div role="search" className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search LRN, student ID or name"
          aria-label="Search the roster"
          maxLength={50}
          autoComplete="off"
          spellCheck={false}
          className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />

        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showSchoolYear && (
        <select
          value={schoolYearId}
          onChange={(e) => onSchoolYearChange?.(e.target.value)}
          disabled={schoolYearDisabled}
          aria-label="School year"
          className="h-10 shrink-0 rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60"
        >
          {schoolYears.map((year) => (
            <option key={year.id} value={year.id}>
              S.Y. {year.label}
              {year.isActive ? " (active)" : ""}
            </option>
          ))}
        </select>
      )}

      {showMissingFilter && (
        <button
          type="button"
          aria-pressed={missingOnly}
          onClick={() => onMissingOnlyChange(!missingOnly)}
          className={cn(
            "h-10 shrink-0 rounded-md border px-3 text-sm transition-colors",
            missingOnly
              ? "border-primary bg-primary/10 font-medium text-foreground"
              : "border-input bg-white text-muted-foreground hover:text-foreground",
          )}
        >
          Missing final average ({missingCount})
        </button>
      )}
    </div>
  );
}

// // src/components/sections/roster-toolbar.tsx
// "use client";

// import { Search, X } from "lucide-react";
// import { cn } from "@/lib/utils";

// type RosterToolbarProps = {
//   search: string;
//   onSearchChange: (value: string) => void;
//   missingOnly: boolean;
//   onMissingOnlyChange: (value: boolean) => void;
//   // How many learners in the current view have no final average yet.
//   missingCount: number;
//   // Teachers don't enter final averages, so they don't need this filter.
//   showMissingFilter: boolean;
// };

// // Search and filter for the roster. The parent owns both values (plain state),
// // and the list is filtered locally, so it also works in the offline preview.
// export function RosterToolbar({
//   search,
//   onSearchChange,
//   missingOnly,
//   onMissingOnlyChange,
//   missingCount,
//   showMissingFilter,
// }: RosterToolbarProps) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//       <div role="search" className="relative flex-1">
//         <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

//         <input
//           type="text"
//           value={search}
//           onChange={(e) => onSearchChange(e.target.value)}
//           placeholder="Search LRN, student ID or name"
//           aria-label="Search the roster"
//           maxLength={50}
//           autoComplete="off"
//           spellCheck={false}
//           className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
//         />

//         {search && (
//           <button
//             type="button"
//             onClick={() => onSearchChange("")}
//             aria-label="Clear search"
//             className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//           >
//             <X className="size-4" />
//           </button>
//         )}
//       </div>

//       {showMissingFilter && (
//         <button
//           type="button"
//           aria-pressed={missingOnly}
//           onClick={() => onMissingOnlyChange(!missingOnly)}
//           className={cn(
//             "h-10 shrink-0 rounded-md border px-3 text-sm transition-colors",
//             missingOnly
//               ? "border-primary bg-primary/10 font-medium text-foreground"
//               : "border-input bg-white text-muted-foreground hover:text-foreground",
//           )}
//         >
//           Missing final average ({missingCount})
//         </button>
//       )}
//     </div>
//   );
// }
