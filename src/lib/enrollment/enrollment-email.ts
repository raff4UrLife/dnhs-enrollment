// src/lib/enrollment/enrollment-email.ts
import "server-only";
import { sendEmail } from "@/lib/email";

type EnrollmentEmailInput = {
  to: string;
  firstName: string;
  schoolYear: string; // e.g. "2026-2027"
  gradeLevel: number; // 7 to 12
};

// Stops names from breaking the HTML
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Tells the student they are enrolled. Returns true if sent, false if not.
// Never throws (sendEmail never throws), so a failed email cannot undo an enrollment.
export async function sendEnrollmentEmail({
  to,
  firstName,
  schoolYear,
  gradeLevel,
}: EnrollmentEmailInput): Promise<boolean> {
  const name = escapeHtml(firstName.trim());
  const year = escapeHtml(schoolYear);
  const grade = Number(gradeLevel);

  const html = `
<div style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f2a5c;padding:20px 24px;border-bottom:4px solid #d4a017;">
      <p style="margin:0;font-size:18px;font-weight:bold;color:#ffffff;">Dimasalang National High School</p>
    </div>
    <div style="padding:24px;line-height:1.6;font-size:15px;">
      <p style="margin:0 0 16px;">Dear ${name},</p>
      <p style="margin:0 0 16px;">
        Congratulations! Your enrollment for School Year <strong>${year}</strong>
        has been approved, and you are now officially enrolled as a
        <strong>Grade ${grade}</strong> student at Dimasalang National High School.
      </p>
      <p style="margin:0 0 16px;">
        Thank you for choosing Dimasalang National High School. We are glad to
        welcome you to our school community.
      </p>
      <p style="margin:24px 0 0;">
        Warm regards,<br />
        <strong>Office of the Registrar</strong><br />
        Dimasalang National High School
      </p>
    </div>
  </div>
</div>`;

  return sendEmail({
    to,
    subject: "You're now enrolled at Dimasalang National High School",
    html,
  });
}
