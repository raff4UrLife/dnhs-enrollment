// src/lib/enrollment/reminder-email.ts
import "server-only";
import { sendEmail } from "@/lib/email";

type ReminderEmailInput = {
  to: string;
  firstName: string;
  expiresAt: string; // ISO timestamp from applications.expires_at
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

// Reminds an applicant to visit the school before the application expires.
// Returns true if sent, false if not. Never throws (sendEmail never throws).
export async function sendReminderEmail({
  to,
  firstName,
  expiresAt,
}: ReminderEmailInput): Promise<boolean> {
  const name = escapeHtml(firstName.trim());
  const deadline = escapeHtml(
    new Date(expiresAt).toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  );

  const html = `
<div style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f2a5c;padding:20px 24px;border-bottom:4px solid #d4a017;">
      <p style="margin:0;font-size:18px;font-weight:bold;color:#ffffff;">Dimasalang National High School</p>
    </div>
    <div style="padding:24px;line-height:1.6;font-size:15px;">
      <p style="margin:0 0 16px;">Dear ${name},</p>
      <p style="margin:0 0 16px;">
        This is a friendly reminder that your pre-enrollment application is
        still <strong>pending</strong>. To complete your enrollment, please
        visit the school and bring your requirements for verification
        on or before <strong>${deadline}</strong>.
      </p>
      <p style="margin:0 0 16px;">
        Applications that are not verified by then are removed automatically,
        and you would need to submit a new one.
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
    subject:
      "Reminder: please visit Dimasalang National High School to complete your enrollment",
    html,
  });
}
