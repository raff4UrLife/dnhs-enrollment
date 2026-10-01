import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Dimasalang National High School",
  description: "Terms for using the DNHS Online Enrollment Management System.",
  robots: { index: false, follow: false },
};

// Change this to the school's official contact email.
const CONTACT_EMAIL = "your-school-email@example.com";

const sections = [
  {
    title: "1. Acceptance of these terms",
    body: [
      "By using the Dimasalang National High School (DNHS) Online Enrollment Management System, you agree to these terms. If you do not agree, please do not use the system and enroll in person at the school instead.",
    ],
  },
  {
    title: "2. What the system does",
    body: [
      "The system lets new and transfer learners submit an optional online pre-enrollment application. It supports, and does not replace, the school's regular walk-in enrollment. Submitting an application does not guarantee admission or a slot in a particular section.",
      "An application is only complete once the school has received and checked the required documents in person and school personnel have approved it.",
    ],
  },
  {
    title: "3. Your responsibilities",
    list: [
      "Provide accurate and complete information, including the learner's correct LRN.",
      "Submit only your own or your child's information, or information you are authorized to submit.",
      "Upload only genuine documents and photos, in the accepted image formats and file sizes shown on the form.",
      "Do not submit false, misleading, or spam applications.",
    ],
  },
  {
    title: "4. One application per learner",
    body: [
      "Each Learner Reference Number (LRN) can have only one application on file. If an application with the same LRN already exists, a new submission will be declined. Please visit the school if you believe this is a mistake.",
    ],
  },
  {
    title: "5. Pending applications",
    body: [
      "Online applications that are not approved within the set period are automatically deleted. If you provided an email address, we will send a notice, and you may submit a new application.",
    ],
  },
  {
    title: "6. Admin portal access",
    body: [
      "The admin portal is only for school personnel who have been authorized by the school. Signing in with a Google account does not grant access by itself. Attempting to access the portal or its data without authorization is prohibited.",
    ],
  },
  {
    title: "7. What the system does not do",
    body: [
      "The system does not process payments and does not provide a student portal. It is not a replacement for DepEd's Learner Information System.",
    ],
  },
  {
    title: "8. Availability and changes",
    body: [
      "We try to keep the system available, but we do not guarantee uninterrupted service. The school may change or suspend the system, and may update these terms. Continued use after changes means you accept the updated terms.",
    ],
  },
  {
    title: "9. Privacy",
    body: ["How we handle personal data is described in our Privacy Policy."],
  },
  {
    title: "10. Contact us",
    body: [
      `For questions about these terms, contact the DNHS registrar's office at ${CONTACT_EMAIL} or visit the school in person.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Terms of Service
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
