import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ViewButton({
  applicationId,
  studentName,
}: {
  applicationId: string;
  studentName: string;
}) {
  return (
    <Button
      render={<Link href={`/admin/applications/${applicationId}`} />}
      size="sm"
      aria-label={`View application of ${studentName}`}
    >
      <Eye className="size-4" />
      View
    </Button>
  );
}
