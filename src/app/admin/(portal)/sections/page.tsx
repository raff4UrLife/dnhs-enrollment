// src/app/admin/(portal)/sections/page.tsx
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { loadRosterData } from "@/lib/sections/roster-data";
import type { RosterPermissions } from "@/lib/sections/types";
import { SectionRosterConnected } from "@/components/sections/section-roster-connected";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = {
  searchParams: Promise<{ schoolyear?: string | string[] }>;
};

export default async function SectionsPage({ searchParams }: PageProps) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  // Admin and staff can enter final averages and move learners.
  // Teachers can only view. The server actions check this again on their own.
  const canEdit = staff.role === "admin" || staff.role === "staff";
  const permissions: RosterPermissions = {
    canEditFinalAverage: canEdit,
    canOverrideSection: canEdit,
  };

  // The chosen school year comes from the URL. Anything that isn't a valid id
  // is ignored, and the loader then uses the active school year.
  const params = await searchParams;
  const raw = Array.isArray(params.schoolyear)
    ? params.schoolyear[0]
    : params.schoolyear;
  const requestedId = raw && UUID_PATTERN.test(raw) ? raw : undefined;

  // If the id doesn't match a school year, fall back to the active one.
  const data =
    (await loadRosterData(requestedId)) ??
    (requestedId ? await loadRosterData() : null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Section Rosters</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data
            ? `Learners per section for S.Y. ${data.schoolYearLabel}`
            : "Learners per section"}
        </p>
      </div>

      {data ? (
        <SectionRosterConnected data={data} permissions={permissions} />
      ) : (
        <p className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          There is no active school year yet. Set one in School Year Management.
        </p>
      )}
    </div>
  );
}

// // src/app/admin/(portal)/sections/page.tsx
// import { redirect } from "next/navigation";
// import { getCurrentStaff } from "@/lib/auth/require-role";
// import { loadRosterData } from "@/lib/sections/roster-data";
// import type { RosterPermissions } from "@/lib/sections/types";
// import { SectionRosterConnected } from "@/components/sections/section-roster-connected";

// export default async function SectionsPage() {
//   const staff = await getCurrentStaff();
//   if (!staff) redirect("/admin/login");

//   // Admin and staff can enter final averages and move learners.
//   // Teachers can only view. The server actions check this again on their own.
//   const canEdit = staff.role === "admin" || staff.role === "staff";
//   const permissions: RosterPermissions = {
//     canEditFinalAverage: canEdit,
//     canOverrideSection: canEdit,
//   };

//   const data = await loadRosterData();

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-semibold">Section Rosters</h1>
//         <p className="mt-1 text-sm text-muted-foreground">
//           {data
//             ? `Learners per section for S.Y. ${data.schoolYearLabel}`
//             : "Learners per section"}
//         </p>
//       </div>

//       {data ? (
//         <SectionRosterConnected data={data} permissions={permissions} />
//       ) : (
//         <p className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
//           There is no active school year yet. Set one in School Year Management.
//         </p>
//       )}
//     </div>
//   );
// }
