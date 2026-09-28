export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Public applicants: images only, so the 1 MB result is guaranteed.
// PDF/.docx will be allowed later, on the admin side only.
export const DOC_TYPES = IMAGE_TYPES;
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // before compression

export function validateFile(file: File, allowed: string[]): string | null {
  if (!allowed.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_INPUT_BYTES) return "Image must be 10 MB or smaller.";
  return null;
}
