// scripts/build-portfolio-metadata.mjs
// Scans /public/portfolio, writes data/portfolio.json with width/height/blurDataURL
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "public", "portfolio");
const OUT_JSON = path.join(ROOT, "data", "portfolio.json");

function isImg(f) { return /\.(jpe?g|png|webp|avif)$/i.test(f); }

async function main() {
  const files = (await fs.readdir(SRC_DIR)).filter(isImg).sort();
  const out = [];
  for (const name of files) {
    const abs = path.join(SRC_DIR, name);
    const img = sharp(abs);
    const meta = await img.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;

    // super small blur preview (webp)
    const blurBuf = await img
      .resize(16)        // tiny!
      .webp({ quality: 40 })
      .toBuffer();
    const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

    out.push({
      src: `/portfolio/${name}`,
      w, h,
      aspect: w && h ? Number((w / h).toFixed(3)) : 1.5,
      landscape: w > h,
      blurDataURL
    });
  }
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} entries → ${path.relative(ROOT, OUT_JSON)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
