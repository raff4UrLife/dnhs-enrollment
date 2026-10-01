import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Dimasalang National High School",
  description:
    "How the DNHS Online Enrollment Management System collects, uses, and protects personal data.",
  robots: { index: false, follow: false },
};

// Change this to the school's official contact email.
const CONTACT_EMAIL = "your-school-email@example.com";

const sections = [
  {
    title: "1. Who this applies to",
    body: [
      "This policy covers learners, parents, and guardians who submit an online pre-enrollment application, and authorized school personnel who sign in to the admin portal of the Dimasalang National High School (DNHS) Online Enrollment Management System.",
    ],
  },
  {
    title: "2. What we collect",
    list: [
      "Learner information: name, birthdate, sex, Learner Reference Number (LRN), address, previous school details, general average, and learning modality or special-needs information provided on the form.",
      "Parent or guardian information provided on the form.",
      "Uploaded documents and a profile photo (for example PSA birth certificate, Form 138, and Good Moral certificate).",
      "An optional email address, used only for enrollment notices.",
      "For authorized school personnel: the name and email address of the Google account used to sign in.",
    ],
  },
  {
    title: "3. Why we collect it",
    list: [
      "To process and review enrollment applications.",
      "To create learner records and place learners in sections.",
      "To produce school reports and statistics, such as enrollment counts by grade level, gender, age, and barangay.",
      "To send enrollment notices by email, only if an email address was provided.",
    ],
  },
  {
    title: "4. How we store and protect it",
    body: [
      "Data is stored with our service providers: Supabase (database and file storage), Vercel (website hosting), Google (staff sign-in), and Gmail (email notices). Data is sent over secure HTTPS connections, and access to learner records is limited to authorized school personnel according to their assigned role.",
      "We do not sell personal data or use it for advertising.",
    ],
  },
  {
    title: "5. How long we keep it",
    body: [
      "Online applications that remain pending are automatically deleted after a set period, and an email notice is sent if an email address was provided. Approved applications become part of the learner's school record, which is kept as required for school records.",
    ],
  },
  {
    title: "6. Your rights",
    body: [
      "Under the Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to be informed, to access and correct your data, to object to or request the blocking or removal of your data, and to file a complaint with the National Privacy Commission. If the learner is a minor, a parent or guardian may exercise these rights on their behalf.",
    ],
  },
  {
    title: "7. Contact us",
    body: [
      `For questions or requests about your data, contact the DNHS registrar's office at ${CONTACT_EMAIL} or visit the school in person.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dimasalang National High School Online Enrollment Management System.
        Last updated: September 2026.
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-foreground">
              {section.title}
            </h2>
            {section.body?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-2 leading-7 text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="mt-2 list-disc space-y-1.5 pl-6 leading-7 text-muted-foreground">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
