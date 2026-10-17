// src/lib/sections/roster-export.ts
// Pure helpers (no server or React imports): builds the CSV text and the file name.
// Works online and in the offline preview.
import type { RosterSection, RosterStudent } from "./types";

const HEADERS = [
  "No.",
  "Last Name",
  "First Name",
  "M.I.",
  "Gender",
  "Grade Level",
  "Strand",
  "Section",
  "Section Order",
];

// Makes one value safe for a CSV cell.
// Names come from the public form, so a value starting with = + - @ could run as a
// formula when opened in Excel. A leading ' stops that.
function cell(value: string | number): string {
  if (typeof value === "number") return String(value);

  let text = value;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

function middleInitial(middleName: string | null): string {
  const first = middleName?.trim().charAt(0);
  return first ? `${first.toUpperCase()}.` : "";
}

// Grade, then strand, then section order, then name. Learners whose section
// can't be found go last.
function sortForExport(
  students: RosterStudent[],
  sectionById: Map<string, RosterSection>,
): RosterStudent[] {
  return [...students].sort((a, b) => {
    const sa = sectionById.get(a.sectionId);
    const sb = sectionById.get(b.sectionId);

    if (!sa && !sb) return 0;
    if (!sa) return 1;
    if (!sb) return -1;

    return (
      sa.gradeLevel - sb.gradeLevel ||
      (sa.strandLabel ?? "").localeCompare(sb.strandLabel ?? "") ||
      sa.sectionOrder - sb.sectionOrder ||
      a.lastName.localeCompare(b.lastName) ||
      a.firstName.localeCompare(b.firstName)
    );
  });
}

// students must already be filtered (all pages, not only the one on screen).
// The order is set here, so the file is always organized by section.
// "No." starts again at 1 in each section, like a class list.
export function buildRosterCsv(
  students: RosterStudent[],
  sections: RosterSection[],
): string {
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const ordered = sortForExport(students, sectionById);

  const lines = [HEADERS.map(cell).join(",")];

  let currentSectionId: string | null = null;
  let numberInSection = 0;

  for (const student of ordered) {
    if (student.sectionId !== currentSectionId) {
      currentSectionId = student.sectionId;
      numberInSection = 0;
    }
    numberInSection += 1;

    const section = sectionById.get(student.sectionId);
    lines.push(
      [
        numberInSection,
        student.lastName,
        student.firstName,
        middleInitial(student.middleName),
        student.gender ?? "",
        section ? section.gradeLevel : "",
        section?.strandLabel ?? "",
        section?.name ?? "",
        section ? section.sectionOrder : "",
      ]
        .map(cell)
        .join(","),
    );
  }

  // The BOM makes Excel read names like "Muñoz" correctly. CRLF is what Excel expects.
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// e.g. section-roster-2026-2027-grade-11-stem-apex-stem.csv
export function rosterFileName(parts: {
  schoolYear: string;
  grade: string;
  strand: string; // "" = all strands
  sectionName: string | null; // null = all sections
}): string {
  const pieces = [
    "section-roster",
    slug(parts.schoolYear),
    `grade-${slug(parts.grade)}`,
    parts.strand ? slug(parts.strand) : "",
    parts.sectionName ? slug(parts.sectionName) : "",
  ].filter(Boolean);

  return `${pieces.join("-")}.csv`;
}
