// src/components/sections/roster-table.tsx
"use client";

import { useMemo } from "react";
import type {
  RosterActionResult,
  RosterPermissions,
  RosterSection,
  RosterStudent,
} from "@/lib/sections/types";
import {
  paginate,
  ROSTER_PAGE_SIZE,
  RosterPagination,
} from "./roster-pagination";
import { RosterRow } from "./roster-row";

type RosterTableProps = {
  students: RosterStudent[]; // already filtered, all pages
  sections: RosterSection[];
  page: number;
  onPageChange: (page: number) => void;
  permissions: RosterPermissions;
  onSaveFinalAverage: (
    enrollmentId: string,
    value: number | null,
  ) => Promise<RosterActionResult>;
  onMove: (student: RosterStudent) => void;
  // Shown when there are no rows, so the parent can say why (filters vs. empty).
  emptyMessage?: string;
};

const HEADER_CELL =
  "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function RosterTable({
  students,
  sections,
  page,
  onPageChange,
  permissions,
  onSaveFinalAverage,
  onMove,
  emptyMessage = "No learners found.",
}: RosterTableProps) {
  const sectionNames = useMemo(
    () => new Map(sections.map((s) => [s.id, s.name])),
    [sections],
  );

  // section id -> section_order, shown in its own column.
  const sectionOrders = useMemo(
    () => new Map(sections.map((s) => [s.id, s.sectionOrder])),
    [sections],
  );

  // section id -> strand label (null for Grades 7-10).
  const sectionStrands = useMemo(
    () => new Map(sections.map((s) => [s.id, s.strandLabel])),
    [sections],
  );

  // Show the Strand column only when at least one listed learner is in a
  // section that has a strand (Grades 11-12). Grades 7-10 stay unchanged.
  const showStrand = useMemo(
    () => students.some((s) => sectionStrands.get(s.sectionId) != null),
    [students, sectionStrands],
  );

  // Safety net: if the list got shorter, never point at a page that doesn't exist.
  const totalPages = Math.max(1, Math.ceil(students.length / ROSTER_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const rows = paginate(students, safePage, ROSTER_PAGE_SIZE);
  const firstNumber = (safePage - 1) * ROSTER_PAGE_SIZE + 1;

  // Base columns: #, LRN, Name, Gender, Average, Final average, Section, Section order.
  const columnCount =
    8 + (showStrand ? 1 : 0) + (permissions.canOverrideSection ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-205 border-collapse">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className={HEADER_CELL}>#</th>
              <th className={HEADER_CELL}>LRN</th>
              <th className={HEADER_CELL}>Name</th>
              <th className={HEADER_CELL}>Gender</th>
              <th className={`${HEADER_CELL} text-right`}>Average</th>
              <th className={`${HEADER_CELL} text-right`}>Final average</th>
              {showStrand && <th className={HEADER_CELL}>Strand</th>}
              <th className={HEADER_CELL}>Section</th>
              <th className={`${HEADER_CELL} text-center`}>Section order</th>
              {permissions.canOverrideSection && (
                <th className={`${HEADER_CELL} text-right`}>Action</th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((student, index) => (
                <RosterRow
                  key={student.enrollmentId}
                  student={student}
                  number={firstNumber + index}
                  sectionName={sectionNames.get(student.sectionId) ?? "—"}
                  sectionOrder={sectionOrders.get(student.sectionId) ?? null}
                  strandLabel={sectionStrands.get(student.sectionId) ?? null}
                  showStrand={showStrand}
                  permissions={permissions}
                  onSaveFinalAverage={onSaveFinalAverage}
                  onMove={onMove}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <RosterPagination
        page={safePage}
        total={students.length}
        onPageChange={onPageChange}
      />
    </div>
  );
}

// // src/components/sections/roster-table.tsx
// "use client";

// import { useMemo } from "react";
// import type {
//   RosterActionResult,
//   RosterPermissions,
//   RosterSection,
//   RosterStudent,
// } from "@/lib/sections/types";
// import {
//   paginate,
//   ROSTER_PAGE_SIZE,
//   RosterPagination,
// } from "./roster-pagination";
// import { RosterRow } from "./roster-row";

// type RosterTableProps = {
//   students: RosterStudent[]; // already filtered, all pages
//   sections: RosterSection[];
//   page: number;
//   onPageChange: (page: number) => void;
//   permissions: RosterPermissions;
//   onSaveFinalAverage: (
//     enrollmentId: string,
//     value: number | null,
//   ) => Promise<RosterActionResult>;
//   onMove: (student: RosterStudent) => void;
//   // Shown when there are no rows, so the parent can say why (filters vs. empty).
//   emptyMessage?: string;
// };

// const HEADER_CELL =
//   "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";

// export function RosterTable({
//   students,
//   sections,
//   page,
//   onPageChange,
//   permissions,
//   onSaveFinalAverage,
//   onMove,
//   emptyMessage = "No learners found.",
// }: RosterTableProps) {
//   const sectionNames = useMemo(
//     () => new Map(sections.map((s) => [s.id, s.name])),
//     [sections],
//   );

//   // Safety net: if the list got shorter, never point at a page that doesn't exist.
//   const totalPages = Math.max(1, Math.ceil(students.length / ROSTER_PAGE_SIZE));
//   const safePage = Math.min(Math.max(page, 1), totalPages);

//   const rows = paginate(students, safePage, ROSTER_PAGE_SIZE);
//   const firstNumber = (safePage - 1) * ROSTER_PAGE_SIZE + 1;

//   return (
//     <div className="space-y-3">
//       <div className="overflow-x-auto rounded-lg border bg-white">
//         <table className="w-full min-w-205 border-collapse">
//           <thead className="border-b bg-muted/50">
//             <tr>
//               <th className={HEADER_CELL}>#</th>
//               <th className={HEADER_CELL}>LRN</th>
//               <th className={HEADER_CELL}>Name</th>
//               <th className={HEADER_CELL}>Gender</th>
//               <th className={`${HEADER_CELL} text-right`}>Average</th>
//               <th className={`${HEADER_CELL} text-right`}>Final average</th>
//               <th className={HEADER_CELL}>Section</th>
//               {permissions.canOverrideSection && (
//                 <th className={`${HEADER_CELL} text-right`}>Action</th>
//               )}
//             </tr>
//           </thead>

//           <tbody>
//             {rows.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={permissions.canOverrideSection ? 8 : 7}
//                   className="px-3 py-10 text-center text-sm text-muted-foreground"
//                 >
//                   {emptyMessage}
//                 </td>
//               </tr>
//             ) : (
//               rows.map((student, index) => (
//                 <RosterRow
//                   key={student.enrollmentId}
//                   student={student}
//                   number={firstNumber + index}
//                   sectionName={sectionNames.get(student.sectionId) ?? "—"}
//                   permissions={permissions}
//                   onSaveFinalAverage={onSaveFinalAverage}
//                   onMove={onMove}
//                 />
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <RosterPagination
//         page={safePage}
//         total={students.length}
//         onPageChange={onPageChange}
//       />
//     </div>
//   );
// }
