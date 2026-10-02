// src/app/admin/(portal)/applications/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReferenceProvider } from "@/lib/enrollment/reference-context";
import { loadReferenceData } from "@/lib/enrollment/load-reference-data";
import { formFromRow } from "@/lib/enrollment/form-from-row";
import { ApplicationForm } from "../_components/application-form";

type Props = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplicationDetailPage({ params }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const admin = createAdminClient();
  const [{ data: row }, reference] = await Promise.all([
    admin.from("applications").select("*").eq("id", id).maybeSingle(),
    loadReferenceData(),
  ]);
  if (!row) notFound();

  // Teachers are view-only, and only pending applications can be edited
  const canEdit = staff.role === "admin" || staff.role === "staff";
  let readOnlyReason: string | null = null;
  if (!canEdit) {
    readOnlyReason =
      "You have view-only access, so this application cannot be edited.";
  } else if (row.status !== "pending") {
    readOnlyReason =
      "This application is already approved, so it can no longer be edited.";
  }

  const fullName = [row.last_name, row.first_name].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-all duration-200 hover:text-secondary hover:bg-primary/10 border-2 border-primary px-3 py-1.5 rounded-md"
        >
          <ArrowLeft className="size-4" />
          Back to applications
        </Link>

        <h1 className="mt-3 font-serif text-2xl font-semibold text-foreground">
          {fullName || "Application"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          LRN {row.lrn} · {row.status === "approved" ? "Approved" : "Pending"}
        </p>
      </div>

      <ReferenceProvider value={reference}>
        <ApplicationForm
          mode="edit"
          applicationId={row.id}
          initialData={formFromRow(row)}
          readOnlyReason={readOnlyReason}
        />
      </ReferenceProvider>
    </div>
  );
}
