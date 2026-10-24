// scripts/make-round-icons.mjs
import sharp from "sharp";

const SOURCE = "src/app/apple-icon.png";
const SIZES = [192, 512];

for (const size of SIZES) {
  // A white circle used as a cutout: everything outside it becomes transparent
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );

  await sharp(SOURCE)
    .trim({ threshold: 20 }) // remove any margin around the seal
    .resize(size, size, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(`public/icons/icon-${size}-round.png`);
}

console.log("Done: public/icons/icon-192-round.png and icon-512-round.png");
