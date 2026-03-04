#!/usr/bin/env node
/**
 * Generate missing public/ image assets from LogoTSC.jpg using sharp.
 * Run once: node scripts/_gen-assets.mjs
 */
import sharp from "sharp";
import { writeFileSync, readFileSync, rmSync } from "fs";

const src = "public/LogoTSC.jpg";

async function run() {
  // OG image 1200x630 (pad with dark background)
  await sharp(src)
    .resize(1200, 630, { fit: "contain", background: { r: 10, g: 10, b: 10 } })
    .jpeg({ quality: 90 })
    .toFile("public/og-image.jpg");
  console.log("✓ og-image.jpg");

  // Square logo 300x300
  await sharp(src)
    .resize(300, 300, { fit: "contain", background: { r: 10, g: 10, b: 10 } })
    .png()
    .toFile("public/logo.png");
  console.log("✓ logo.png");

  // Apple touch icon 180x180
  await sharp(src)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toFile("public/apple-touch-icon.png");
  console.log("✓ apple-touch-icon.png");

  // icon-192.png (PWA manifest)
  await sharp(src)
    .resize(192, 192, { fit: "contain", background: { r: 10, g: 10, b: 10 } })
    .png()
    .toFile("public/icon-192.png");
  console.log("✓ icon-192.png");

  // icon-192x192.png (push-sw.js badge reference)
  await sharp(src)
    .resize(192, 192, { fit: "contain", background: { r: 10, g: 10, b: 10 } })
    .png()
    .toFile("public/icon-192x192.png");
  console.log("✓ icon-192x192.png");

  // icon-512.png (PWA manifest)
  await sharp(src)
    .resize(512, 512, { fit: "contain", background: { r: 10, g: 10, b: 10 } })
    .png()
    .toFile("public/icon-512.png");
  console.log("✓ icon-512.png");

  // favicon.ico — produce a 32px PNG wrapped as .ico fallback
  // (modern browsers prefer favicon.svg which already exists)
  await sharp(src)
    .resize(32, 32, { fit: "contain", background: { r: 10, g: 10, b: 10 } })
    .png()
    .toFile("public/_fav32.png");
  writeFileSync("public/favicon.ico", readFileSync("public/_fav32.png"));
  rmSync("public/_fav32.png");
  console.log("✓ favicon.ico");

  console.log("\nAll public assets generated.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
