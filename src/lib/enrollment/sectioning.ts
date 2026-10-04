// src/lib/enrollment/sectioning.ts

export type SectionCandidate = {
  id: string;
  sectionOrder: number; // 1 = top section
  minAverage: number | null; // lowest average for this section; null = no lower limit
  capacity: number; // recommended size (40)
  count: number; // learners already placed in it
};

/**
 * Picks the section for a learner with the given general average.
 * Returns null only when there are no sections at all.
 *
 * 1. Go through sections in order and start at the first one whose minimum
 *    average the learner reaches. A section with no minimum accepts anyone.
 *    If the average is below every minimum, start at the last section.
 * 2. If that section is full, use the next ones after it.
 * 3. If none after it has room, use the nearest one before it.
 * 4. If every section is full, use the least filled one.
 *
 * With no minimums set at all, step 1 starts at section 1, so sections simply
 * fill in order (section 1 until it is full, then section 2, and so on).
 */
export function pickSection(
  candidates: SectionCandidate[],
  average: number,
): string | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort(
    (a, b) => a.sectionOrder - b.sectionOrder,
  );

  let start = sorted.findIndex(
    (s) => s.minAverage === null || s.minAverage <= average,
  );
  if (start === -1) start = sorted.length - 1;

  const hasRoom = (s: SectionCandidate) => s.count < s.capacity;

  for (let i = start; i < sorted.length; i++) {
    if (hasRoom(sorted[i])) return sorted[i].id;
  }
  for (let i = start - 1; i >= 0; i--) {
    if (hasRoom(sorted[i])) return sorted[i].id;
  }

  // Every section is full: soft limit, so pick the least filled
  let least = sorted[0];
  for (const s of sorted) {
    if (s.count < least.count) least = s;
  }
  return least.id;
}
