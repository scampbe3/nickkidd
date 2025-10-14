// scripts/add-dimensions-to-photos.mjs
// Reads data/photos.json, looks up files in /public/portfolio, adds w/h.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public", "portfolio");
const JSON_PATH = path.join(ROOT, "data", "photos.json");

function fnameFromSrc(src) {
  // src = "/portfolio/Photo-.....jpg"
  return src.replace(/^\/+/, "").split("/").slice(1).join("/");
}

async function main() {
  const raw = JSON.parse(await fs.readFile(JSON_PATH, "utf-8"));
  let changed = 0;

  for (const item of raw) {
    try {
      if (item.w && item.h) continue;
      const name = fnameFromSrc(item.src);
      const abs = path.join(PUBLIC, name);
      const meta = await sharp(abs).metadata();
      if (meta.width && meta.height) {
        item.w = meta.width;
        item.h = meta.height;
        changed++;
      }
    } catch (e) {
      console.warn("Could not read", item.src, e.message);
    }
  }

  if (changed) {
    await fs.writeFile(JSON_PATH, JSON.stringify(raw, null, 2));
    console.log(`Updated ${changed} entries with w/h in ${path.relative(ROOT, JSON_PATH)}`);
  } else {
    console.log("No changes needed.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
