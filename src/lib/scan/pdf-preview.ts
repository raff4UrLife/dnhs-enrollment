// src/lib/scan/pdf-preview.ts
// Our scanner writes each PDF as one page holding one JPEG. These helpers read
// that JPEG back out so a scanned PDF can be shown as a normal image preview.

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Returns the embedded JPEG, or null if the PDF was not made by our scanner.
export async function extractScanImage(pdf: Blob): Promise<Blob | null> {
  const bytes = new Uint8Array(await pdf.arrayBuffer());

  // The JPEG starts at the first FF D8 FF (the PDF header before it is plain text)
  let start = -1;
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;

  // It ends right before the last "endstream" in the file
  const marker = new TextEncoder().encode("endstream");
  let markerAt = -1;
  for (let i = bytes.length - marker.length; i > start; i--) {
    let match = true;
    for (let j = 0; j < marker.length; j++) {
      if (bytes[i + j] !== marker[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      markerAt = i;
      break;
    }
  }
  if (markerAt < 0) return null;

  const jpeg = bytes.slice(start, markerAt - 1); // skip the newline before "endstream"
  const looksValid =
    jpeg.length > 4 &&
    jpeg[jpeg.length - 2] === 0xff &&
    jpeg[jpeg.length - 1] === 0xd9;
  if (!looksValid) return null;

  return new Blob([jpeg], { type: "image/jpeg" });
}

// Convenience: PDF blob -> data URL of its image, or null if none could be read.
export async function pdfPreviewDataUrl(pdf: Blob): Promise<string | null> {
  const image = await extractScanImage(pdf);
  return image ? blobToDataUrl(image) : null;
}
