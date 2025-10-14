// scripts/capture-social-screens.mjs
// Usage: node scripts/capture-social-screens.mjs
// Captures two screenshots per profile (top + mid) and wires them into data/socials.json

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { setTimeout as sleep } from "node:timers/promises";

puppeteer.use(Stealth());

const ROOT = process.cwd();
const JSON_PATH = path.join(ROOT, "data", "socials.json");
const OUT_DIR   = path.join(ROOT, "public", "social_shots");

const ORDER = ["facebook", "tiktok", "youtube", "instagram"];

function safeSlug(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "profile";
}
function parseHandle(platform, url) {
  try {
    const u = new URL(url);
    const p = u.pathname.split("/").filter(Boolean);
    if (platform === "youtube") {
      if (p[0]?.startsWith("@")) return p[0].slice(1);
      if (p[0] === "channel" && p[1]) return p[1];
      return u.host.replace(/^www\./, "");
    }
    if (platform === "instagram" || platform === "tiktok") {
      const seg = p[0] ?? "";
      return seg.startsWith("@") ? seg.slice(1) : seg || u.host.replace(/^www\./, "");
    }
    if (platform === "facebook") {
      const id = u.searchParams.get("id");
      if (id) return `id-${id}`;
      return p[0] ?? u.host.replace(/^www\./, "");
    }
    return u.host.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
function captureUrl(platform, url) {
  // lighter/public variants reduce login walls
  if (platform === "facebook") {
    const u = new URL(url);
    const id = u.searchParams.get("id");
    if (id) return `https://mbasic.facebook.com/profile.php?id=${id}`;
    return `https://mbasic.facebook.com${u.pathname}`;
  }
  if (platform === "instagram") {
    const u = new URL(url);
    return `https://www.instagram.com${u.pathname.replace(/\/$/, "")}/?hl=en`;
  }
  return url; // tiktok/youtube → as-is
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function captureTwoShots(page, url) {
  // Go to page and give it a moment to settle
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("body", { timeout: 15000 }).catch(() => {});
  await sleep(1800);

  // Full page screenshot
  const full = await page.screenshot({ fullPage: true, type: "jpeg", quality: 85 });

  // Normalize width; then crop two ~16:9 slices (top & mid)
  const base = sharp(full).resize({ width: 1600, withoutEnlargement: true });
  const meta = await base.metadata();
  const W = meta.width || 1600;
  const H = meta.height || 1200;

  const cropH = Math.min(900, Math.round(W * 9 / 16));
  const y1 = 0;
  const y2 = Math.max(0, Math.min(H - cropH, Math.round(H * 0.35)));

  const shot1 = await base.extract({ left: 0, top: y1, width: W, height: Math.min(cropH, H) })
                          .jpeg({ quality: 82 }).toBuffer();
  const shot2 = await base.extract({ left: 0, top: y2, width: W, height: Math.min(cropH, H - y2) })
                          .jpeg({ quality: 82 }).toBuffer();

  return { shot1, shot2 };
}

async function main() {
  await ensureDir(OUT_DIR);
  const raw = JSON.parse(await fs.readFile(JSON_PATH, "utf-8"));
  raw.postsByProfile = raw.postsByProfile || {}; // { platform: { [profileUrl]: [img1, img2] } }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--window-size=1366,2000",
    ],
    defaultViewport: { width: 1366, height: 2000, deviceScaleFactor: 1 },
  });

  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  for (const platform of ORDER) {
    const profiles = (raw.profiles?.[platform] || []).map(p => (typeof p === "string" ? { url: p } : p));
    if (!profiles.length) continue;

    raw.postsByProfile[platform] = raw.postsByProfile[platform] || {};

    for (const profile of profiles) {
      const url = profile.url;
      const handle = parseHandle(platform, url);
      const capUrl = captureUrl(platform, url);

      const page = await browser.newPage();
      await page.setUserAgent(ua);
      await page.setExtraHTTPHeaders({
        "accept-language": "en-US,en;q=0.9",
        "referer": "https://www.google.com/",
      });

      try {
        const { shot1, shot2 } = await captureTwoShots(page, capUrl);

        const base = `${platform}-${safeSlug(handle)}`;
        const file1 = `${base}-1.jpg`;
        const file2 = `${base}-2.jpg`;
        await fs.writeFile(path.join(OUT_DIR, file1), shot1);
        await fs.writeFile(path.join(OUT_DIR, file2), shot2);

        raw.postsByProfile[platform][url] = [
          `/social_shots/${file1}`,
          `/social_shots/${file2}`,
        ];

        console.log(`✓ ${platform} ${url} -> ${file1}, ${file2}`);
      } catch (e) {
        console.warn(`✗ Failed ${platform} ${url}: ${e?.message || e}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  }

  await browser.close().catch(() => {});
  await fs.writeFile(JSON_PATH, JSON.stringify(raw, null, 2));
  console.log(`Updated ${path.relative(ROOT, JSON_PATH)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
