# DNHS Online Enrollment Management System

Online Enrollment Management System with Dashboard Analytics and Sectioning for
Dimasalang National High School (thesis project). It enhances the existing walk-in
enrollment process; it does not replace it.

## Features

- Public site: Home, About and a 6-step pre-enrollment form (new and transfer students only)
- Walk-in encoding by authorized staff (auto-approved), also offline with sync later
- Applications review, approval, learner records and enrollment records
- Automatic sectioning on approval, with manual override and audit logs
- Section Rosters: final average entry, move learners, school year filter, CSV export
- Camera document scanner and profile photo upload (private storage)
- Email notices through Gmail SMTP (enrolled notice, day-6 pending reminder)
- Installable PWA with an offline walk-in form and offline roster preview

## Roles

| Role    | Can do                                                                   |
| ------- | ------------------------------------------------------------------------ |
| admin   | Everything: users, school years, sections, walk-ins, approvals           |
| staff   | Teacher access plus approvals, walk-ins, final averages, moving learners |
| teacher | View and search only (read-only)                                         |

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui (Base UI), Lucide icons,
PostgreSQL on Supabase (Auth, Storage, pg_cron), Google OAuth, Nodemailer (Gmail SMTP),
Serwist (PWA), Dexie.js (IndexedDB), deployed on Vercel.

## Requirements

- Node.js 20.9 or newer and npm
- A Supabase project
- A Google Cloud project (OAuth client)
- A Gmail account with an app password (2-step verification on)

## Setup

1. Clone and install:

```bash
   git clone <repository-url>
   cd dnhs-enrollment
   npm install
```

2. Create `.env.local` in the project root:

```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SECRET_KEY=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASSWORD=
   EMAIL_FROM=
   CRON_SECRET=
```

Never commit this file. The secret key and SMTP password stay on the server only. 3. Database (Supabase SQL Editor): run the schema SQL, then the seed files in `supabase/`
(reference data, `seed_sections_2026_2027.sql`, `seed_sections_shs_2026_2027.sql`).
Row Level Security is enabled on all tables. `learners` needs unique indexes on `lrn`
and `student_id`, and `applications.lrn` has a unique index. 4. Storage: create two private buckets, `profile-pictures` (2 MB, images) and `documents`
(5 MB, images, PDF, docx). No storage policies are needed; the server issues signed links. 5. Auth: in Google Cloud create an OAuth web client with origin `http://localhost:3000` and
the Supabase callback as the redirect URI, then enable the Google provider in Supabase. 6. Whitelist: add your first admin to `whitelisted_users` (email, role `admin`, status
`active`). Only whitelisted, active accounts can sign in. Username/password accounts are
created from the System Users page, which hashes passwords in server code. 7. Cleanup job: enable `pg_cron` in Supabase and create the `expire-pending-applications`
job (deletes online pending applications older than 7 days, set in `settings`). 8. Run:

```bash
   npm run dev                   # development at http://localhost:3000
   npm run build && npm start    # production build, needed to test the PWA and offline
```

Use `localhost`, not `0.0.0.0`, for Google sign-in.

## How it works

- Flow: the public form saves as Pending, the applicant brings requirements to school, and
  staff approve. Approval creates the learner and enrollment, places a section and sends
  an email if the applicant gave an address.
- Walk-ins are inserted by authorized staff and auto-approved in one step.
- Duplicate rule: one application per LRN (12 digits), enforced by a unique index.
- Sectioning: by grade (and strand in Grades 11-12). A section holds 40 (soft cap); the next
  section is used when it fills. Optional `sections.min_average` cutoffs place learners by
  general average. Admin and staff can always move a learner; warnings never block a move.
- Promotion: active learners with a final average of 75+ move up one grade (Grade 12
  graduates); 74 and below stay in the same grade. Previous school years are kept.
- Key changes (approval, section move, final average) are written to `audit_logs`.

## Offline and PWA

- Google and username/password sign-in need internet. After signing in online once, admin
  and staff can use the offline walk-in form for 7 days; logging out clears that access.
- Offline walk-ins are queued in IndexedDB and sent when the connection returns. An item
  leaves the queue only after the server confirms it.
- Rosters are cached for a read-only preview offline. Nobody can edit while offline.
- The service worker caches only static files; `/admin`, `/auth` and `/api` are never cached.

## Deployment (Vercel)

1. Push to GitHub and import the repository in Vercel.
2. Add the same environment variables in the Vercel project settings.
3. Add the production URL to Google Cloud (origins) and to the Supabase redirect URLs.
4. `vercel.json` schedules `/api/cron/expiry-reminders` daily at 01:00 UTC (needs `CRON_SECRET`).
5. Publish the Google OAuth app so any account can attempt login; the whitelist still gates access.

## Project structure

```text
src/app/          Routes: public pages, /admin portal, offline pages, api/cron
src/components/   UI: admin, enrollment, sections, offline, document-scanner
src/lib/          auth, enrollment, sections, offline, supabase, email
supabase/         Seed SQL files
public/           Brand assets, PWA icons, opencv.js
```

## Security notes

- Server code uses the Supabase secret key only after a role check (admin, staff, teacher).
- Passwords are hashed with bcrypt; sessions store only a SHA-256 hash of the token (8 h expiry).
- Username/password login is limited to 5 failed attempts per hour per username.
- Uploaded files live in private buckets and are shown through short-lived signed links.
- Run `npm audit` before each deploy. Do not use `--force`.

## Known limits

- Storage files of expired applications are not deleted automatically yet.
- Section cutoffs for Grades 11-12 and `min_average` values are decided by the school.
- Email is sent only to applicants who give an address.

## Team

Raffy Maluya, Marvie Tamayo, Jashmine Marie Roa, Grace Alibio, Rachel Bandol.
Adviser: Justin Aban, MIT.
