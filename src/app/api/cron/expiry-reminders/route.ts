// src/app/api/cron/expiry-reminders/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/enrollment/reminder-email";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 50; // keeps one run short and well under Gmail's daily sending limit

// Called once a day by Vercel Cron (see vercel.json).
// Finds pending online applications that expire within the next 24 hours
// (day 6 of 7), have an email, and were not reminded yet.
export async function GET(request: Request) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". Anyone else is rejected.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: due, error } = await admin
    .from("applications")
    .select("id, email, first_name, expires_at")
    .eq("channel", "online")
    .eq("status", "pending")
    .is("reminder_sent_at", null)
    .not("email", "is", null)
    .gt("expires_at", now.toISOString())
    .lte("expires_at", in24Hours.toISOString())
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[expiry-reminders] step=load", error);
    return Response.json(
      { error: "Could not load applications" },
      { status: 500 },
    );
  }

  let sent = 0;
  let failed = 0;

  for (const app of due ?? []) {
    const to = String(app.email ?? "").trim();
    if (!to) continue;

    const ok = await sendReminderEmail({
      to,
      firstName: app.first_name,
      expiresAt: app.expires_at,
    });

    if (!ok) {
      // Not marked as sent, so the next daily run tries again (if it hasn't expired yet)
      failed++;
      console.error("[expiry-reminders] step=send application=", app.id);
      continue;
    }

    const { error: markErr } = await admin
      .from("applications")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", app.id);

    if (markErr) {
      console.error(
        "[expiry-reminders] step=mark application=",
        app.id,
        markErr,
      );
    }
    sent++;
  }

  return Response.json({ checked: due?.length ?? 0, sent, failed });
}
