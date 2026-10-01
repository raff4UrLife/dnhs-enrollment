// src/app/admin/(portal)/applications/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "../_components/status-badge";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export default async function ApplicationDetailPage({ params }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("applications")
    .select("id, lrn, last_name, first_name, middle_name, status")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const fullName = `${data.last_name}, ${data.first_name}${
    data.middle_name ? ` ${data.middle_name}` : ""
  }`;

  return (
    <div className="space-y-6">
      <Button render={<Link href="/admin/applications" />} size="sm">
        <ArrowLeft className="size-4" />
        Back to applications
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            {fullName}
          </h1>
          <StatusBadge status={data.status as "pending" | "approved"} />
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          LRN {data.lrn}
        </p>
      </div>

      <div className="rounded-md border border-dashed border-black/20 bg-white p-10 text-center text-sm text-muted-foreground">
        The pre-filled enrollment form will be shown here.
      </div>
    </div>
  );
}
