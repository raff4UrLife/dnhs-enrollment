//src/app/admin/(portal)/applications/page.tsx
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { parseApplicationParams } from "./_lib/search-params";
import { getApplications } from "./_lib/queries";
import { getFilterConfigs } from "./_lib/filter-options";
import { PAGE_SIZE } from "./_lib/types";
import { ApplicationsToolbar } from "./_components/applications-toolbar";
import { ApplicationsTable } from "./_components/applications-table";
import { EmptyState } from "./_components/empty-state";
import { Pagination } from "./_components/pagination";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ApplicationsPage({ searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  // Admin and staff can approve; teachers are view-only
  const canApprove = staff.role === "admin" || staff.role === "staff";

  // Read and validate ?q=...&page=...&gender=... from the URL
  const filters = parseApplicationParams(await searchParams);

  const [result, filterConfigs] = await Promise.all([
    getApplications(filters),
    getFilterConfigs(),
  ]);

  // Is a search or any filter active? (everything except the page number)
  const hasFilters = Object.entries(filters).some(
    ([key, v]) => key !== "page" && v !== null && v !== "",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enrollment applications for the active school year.
        </p>
      </div>

      <ApplicationsToolbar filters={filterConfigs} />

      {result.rows.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <ApplicationsTable rows={result.rows} canApprove={canApprove} />
          <Pagination
            page={result.page}
            total={result.total}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
