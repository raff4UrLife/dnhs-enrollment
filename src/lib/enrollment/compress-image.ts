const MAX_BYTES = 1024 * 1024; // 1 MB
const MAX_SIDE = 1600; // longest side in pixels

function toBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}

export async function compressImage(
  file: File,
  maxBytes: number = MAX_BYTES,
): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";

  for (let attempt = 0; attempt < 5; attempt++) {
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;

    ctx.fillStyle = "#ffffff"; // avoids black background on transparent PNGs
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (let quality = 0.85; quality >= 0.4; quality -= 0.15) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= maxBytes) {
        bitmap.close();
        return new File([blob], name, { type: "image/jpeg" });
      }
    }
    scale *= 0.8; // still too big: shrink dimensions and try again
  }

  bitmap.close();
  throw new Error("Could not compress the image under 1 MB.");
}
