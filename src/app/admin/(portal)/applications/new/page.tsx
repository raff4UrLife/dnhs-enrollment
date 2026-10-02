// src/app/admin/(portal)/applications/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReferenceProvider } from "@/lib/enrollment/reference-context";
import { loadReferenceData } from "@/lib/enrollment/load-reference-data";
import { INITIAL_APPLICATION_FORM } from "@/lib/enrollment/types";
import { ApplicationForm } from "../_components/application-form";

export default async function NewApplicationPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  // Only admin and staff can encode walk-ins; teachers go back to the list
  if (staff.role !== "admin" && staff.role !== "staff") {
    redirect("/admin/applications");
  }

  // Walk-ins go into the active school year
  const admin = createAdminClient();
  const [{ data: year }, reference] = await Promise.all([
    admin
      .from("school_years")
      .select("name")
      .eq("is_active", true)
      .maybeSingle(),
    loadReferenceData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to applications
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-foreground">
          Add New Student
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {year
            ? `Walk-in enrollment for S.Y. ${year.name}. The student is approved and enrolled as soon as you save.`
            : "There is no active school year, so a student cannot be added right now."}
        </p>
      </div>

      {year && (
        <ReferenceProvider value={reference}>
          <ApplicationForm mode="new" initialData={INITIAL_APPLICATION_FORM} />
        </ReferenceProvider>
      )}
    </div>
  );
}
