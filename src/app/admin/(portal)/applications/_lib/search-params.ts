// Reads and validates the URL query (?q=...&page=...&gender=...)

type RawParams = Record<string, string | string[] | undefined>;

export type ApplicationFilters = {
  q: string; // search text (LRN or name)
  page: number;
  grade: number | null; // 7-12
  strand: string | null; // strands.id
  barangay: string | null; // barangays.id
  gender: "Male" | "Female" | null;
  fourPs: boolean | null;
  sped: boolean | null;
  indigenous: boolean | null;
  channel: "online" | "walk-in" | null;
  status: "pending" | "approved" | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// If a param appears twice (?a=1&a=2), use the first
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Search text goes into a database filter, so remove characters that have a
// special meaning there (commas, parentheses, wildcards, quotes, backslash)
function cleanSearch(v: string | undefined): string {
  if (!v) return "";
  return v
    .replace(/[,()%_*\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

function parseUuid(v: string | string[] | undefined): string | null {
  const s = first(v);
  return s && UUID_RE.test(s) ? s : null;
}

function parseYesNo(v: string | string[] | undefined): boolean | null {
  const s = first(v);
  if (s === "yes") return true;
  if (s === "no") return false;
  return null;
}

function parseOneOf<T extends string>(
  v: string | string[] | undefined,
  allowed: readonly T[],
): T | null {
  const s = first(v);
  return allowed.find((a) => a === s) ?? null;
}

function parseGrade(v: string | string[] | undefined): number | null {
  const n = Number.parseInt(first(v) ?? "", 10);
  return Number.isInteger(n) && n >= 7 && n <= 12 ? n : null;
}

function parsePage(v: string | string[] | undefined): number {
  const n = Number.parseInt(first(v) ?? "1", 10);
  return Number.isInteger(n) && n >= 1 && n <= 100000 ? n : 1;
}

export function parseApplicationParams(raw: RawParams): ApplicationFilters {
  return {
    q: cleanSearch(first(raw.q)),
    page: parsePage(raw.page),
    grade: parseGrade(raw.grade),
    strand: parseUuid(raw.strand),
    barangay: parseUuid(raw.barangay),
    gender: parseOneOf(raw.gender, ["Male", "Female"] as const),
    fourPs: parseYesNo(raw.fourps),
    sped: parseYesNo(raw.sped),
    indigenous: parseYesNo(raw.indigenous),
    channel: parseOneOf(raw.channel, ["online", "walk-in"] as const),
    status: parseOneOf(raw.status, ["pending", "approved"] as const),
  };
}
