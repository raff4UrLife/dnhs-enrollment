import { loadOpenCV } from "@/lib/enrollment/load-opencv";

// A4 proportions (1 : 1.414), portrait. Compression brings it under 1 MB later.
const OUT_WIDTH = 1240;
const OUT_HEIGHT = 1754;

type ScannerInstance = {
  extractPaper: (
    image: HTMLCanvasElement,
    width: number,
    height: number,
  ) => HTMLCanvasElement | null;
};

let scanner: ScannerInstance | null = null;

async function getScanner(): Promise<ScannerInstance> {
  if (scanner) return scanner;
  await loadOpenCV();
  const mod = await import("jscanify/client");
  scanner = new mod.default() as unknown as ScannerInstance;
  return scanner;
}

// Returns a cropped, straightened JPEG, or null if no paper was detected.
export async function scanDocument(
  source: HTMLCanvasElement,
): Promise<File | null> {
  try {
    const s = await getScanner();
    const result = s.extractPaper(source, OUT_WIDTH, OUT_HEIGHT);
    if (!result) return null;

    const blob = await new Promise<Blob | null>((resolve) =>
      result.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) return null;
    return new File([blob], "scan.jpg", { type: "image/jpeg" });
  } catch {
    return null;
  }
}
