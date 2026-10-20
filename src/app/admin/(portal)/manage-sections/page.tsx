// src/app/admin/(portal)/manage-sections/page.tsx
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { loadManageData } from "@/lib/sections/manage-data";
import ManageSections from "@/components/sections/manage-sections";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = {
  searchParams: Promise<{ schoolyear?: string | string[] }>;
};

export default async function ManageSectionsPage({ searchParams }: PageProps) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  // Admin only. Staff and teachers are sent back to the dashboard.
  if (staff.role !== "admin") redirect("/admin");

  // The chosen school year comes from the URL. Anything that isn't a valid id
  // is ignored, and the loader then uses the active school year.
  const params = await searchParams;
  const raw = Array.isArray(params.schoolyear)
    ? params.schoolyear[0]
    : params.schoolyear;
  const requestedId = raw && UUID_PATTERN.test(raw) ? raw : undefined;

  // If the id doesn't match a school year, fall back to the active one.
  const data =
    (await loadManageData(requestedId)) ??
    (requestedId ? await loadManageData() : null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manage Sections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data
            ? `Add, edit or remove sections for S.Y. ${data.schoolYearLabel}`
            : "Add, edit or remove sections"}
        </p>
      </div>

      {data ? (
        <ManageSections
          // A new key restarts the form and filters when the year changes.
          key={data.schoolYearId}
          data={data}
        />
      ) : (
        <p className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          There is no active school year yet. Set one in School Year Management.
        </p>
      )}
    </div>
  );
}
