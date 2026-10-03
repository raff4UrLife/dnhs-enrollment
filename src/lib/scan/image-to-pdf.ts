// src/lib/scan/image-to-pdf.ts
// Turns a scanned canvas into a one-page PDF File. No external libraries.
// The JPEG inside is kept under ~900 KB so the finished PDF stays under ~950 KB
// (the server limit is 1 MB). Quality drops only as far as needed.

const IMAGE_BUDGET_BYTES = 900 * 1024;
const MAX_LONG_SIDE = 2000; // px; larger adds size without helping readability
const PAGE_WIDTH_PT = 595; // A4 width in points; page height follows the scan's shape
const QUALITY_STEPS = [0.92, 0.86, 0.8, 0.74, 0.68, 0.62, 0.55];
const MAX_DOWNSCALES = 4;

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not encode the scan.")),
      "image/jpeg",
      quality,
    );
  });
}

function resized(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  if (scale >= 1) return source;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(source.width * scale));
  out.height = Math.max(1, Math.round(source.height * scale));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Could not process the scan.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

// Writes a minimal valid PDF: one page, one JPEG image filling the page.
function buildPdf(jpeg: Uint8Array, width: number, height: number): Blob {
  const pageW = PAGE_WIDTH_PT;
  const pageH = Math.round((PAGE_WIDTH_PT * height) / width);

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    parts.push(bytes);
    length += bytes.length;
  };
  const startObject = (n: number) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
  };

  push("%PDF-1.4\n");

  startObject(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  startObject(3);
  push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
      `/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`,
  );

  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;
  startObject(4);
  push(
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
  );

  startObject(5);
  push(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
      `/Length ${jpeg.length} >>\nstream\n`,
  );
  push(jpeg);
  push("\nendstream\nendobj\n");

  const xrefStart = length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let n = 1; n <= 5; n++) {
    xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return new Blob([out], { type: "application/pdf" });
}

/**
 * Converts a scanned canvas into a one-page PDF File that fits the upload limit.
 * Starts at high quality and only lowers quality (then size) until it fits.
 */
export async function canvasToPdfFile(
  canvas: HTMLCanvasElement,
  fileName = "scan.pdf",
): Promise<File> {
  const longSide = Math.max(canvas.width, canvas.height);
  let work = resized(canvas, Math.min(1, MAX_LONG_SIDE / longSide));

  for (let round = 0; round <= MAX_DOWNSCALES; round++) {
    for (const quality of QUALITY_STEPS) {
      const jpeg = await canvasToJpeg(work, quality);
      if (jpeg.size <= IMAGE_BUDGET_BYTES) {
        const bytes = new Uint8Array(await jpeg.arrayBuffer());
        const pdf = buildPdf(bytes, work.width, work.height);
        const name = fileName.toLowerCase().endsWith(".pdf")
          ? fileName
          : `${fileName}.pdf`;
        return new File([pdf], name, { type: "application/pdf" });
      }
    }
    work = resized(work, 0.85); // still too big at lowest quality: shrink and retry
  }

  throw new Error(
    "The scan is too large. Please try again closer or in better light.",
  );
}
