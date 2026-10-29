// src/lib/school-years/promotion-rule.ts

export const PASSING_AVERAGE = 75;
export const LAST_GRADE = 12;

export type PromotionInput = {
  gradeLevel: number;
  finalAverage: number | null; // entered at year end
  entryAverage: number | null; // the average used for last year's sectioning
};

export type PromotionOutcome =
  // Moves up one grade (Grade 12 is never "promoted", it graduates).
  | {
      kind: "promoted";
      nextGrade: number;
      average: number | null;
      // Grade 10 -> 11 has no strand yet; the Enrollment page sets it later.
      needsStrand: boolean;
    }
  // Average 74 and below: enrolled again in the same grade.
  | { kind: "retained"; nextGrade: number; average: number | null }
  // Grade 12 with 75 or above: no enrollment in the new year.
  | { kind: "graduated" };

// Final average decides. If it was never entered, the entry average is used.
export function decidePromotion(input: PromotionInput): PromotionOutcome {
  const average = input.finalAverage ?? input.entryAverage;
  const passed = average !== null && average >= PASSING_AVERAGE;

  if (!passed) {
    return { kind: "retained", nextGrade: input.gradeLevel, average };
  }

  if (input.gradeLevel >= LAST_GRADE) {
    return { kind: "graduated" };
  }

  return {
    kind: "promoted",
    nextGrade: input.gradeLevel + 1,
    average,
    needsStrand: input.gradeLevel === 10,
  };
}
