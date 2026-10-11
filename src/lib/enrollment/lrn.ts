// src/lib/enrollment/lrn.ts
export const LRN_LENGTH = 12;

const LRN_PATTERN = new RegExp(`^\\d{${LRN_LENGTH}}$`);

export const LRN_ERROR = `LRN must be exactly ${LRN_LENGTH} digits.`;

// True only for exactly LRN_LENGTH digits (ignores spaces around the value)
export function isValidLrn(value: string): boolean {
  return LRN_PATTERN.test(value.trim());
}

// For typing: keep digits only and stop at LRN_LENGTH
export function sanitizeLrnInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, LRN_LENGTH);
}
