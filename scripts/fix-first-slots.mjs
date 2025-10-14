// scripts/fix-first-slots.mjs
// Usage: node scripts/fix-first-slots.mjs
// Sets the FIRST image slot for:
//   - Facebook (id 100094903872941)  -> /public/social_shots/facebook.*
//   - YouTube  (@nix_remix)          -> /public/social_shots/nix_remix.*
// Leaves SECOND slots exactly as they are.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SHOTS_DIR = path.join(ROOT, "public", "social_shots");
const JSON_PATH = path.join(ROOT, "data", "socials.json");
const EXT_OK = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// targets you asked to fix
const TARGETS = [
  { platform: "facebook", handle: "100094903872941", base: "facebook" },
  { platform: "youtube",  handle: "nix_remix",       base: "nix_remix" },
];

const norm = (s) => s.toLowerCase();

function matchProfileUrl(platform, handle, profiles) {
  const list = (profiles[platform] || []).map((p) =>
    typeof p === "string" ? { url: p } : p
  );
  const h = norm(handle);
  for (const p of list) {
    const u = norm(p.url);
    if (platform === "facebook") {
      if (u.includes("facebook.com") && u.includes(h)) return p.url;
    } else if (platform === "youtube") {
      if (u.includes("youtube.com") && (u.includes(`@${h}`) || u.includes(h)))
        return p.url;
    }
  }
  return null;
}

async function findShotByBase(base) {
  const names = await fs.readdir(SHOTS_DIR);
  const candidates = names
    .filter((n) => EXT_OK.has(path.extname(n).toLowerCase()))
    .filter((n) => path.parse(n).name.toLowerCase() === base.toLowerCase());

  if (candidates.length === 0) {
    // fall back to files that start with base (e.g., facebook-1.jpg)
    const starts = names
      .filter((n) => EXT_OK.has(path.extname(n).toLowerCase()))
      .filter((n) => path.parse(n).name.toLowerCase().startsWith(base.toLowerCase()));
    if (starts.length === 0) return null;
    // choose the newest by mtime
    const stats = await Promise.all(
      starts.map(async (n) => ({
        n,
        t: (await fs.stat(path.join(SHOTS_DIR, n))).mtimeMs,
      }))
    );
    stats.sort((a, b) => b.t - a.t);
    return `/social_shots/${stats[0].n}`;
  }
  // exact name match (ignore extension), prefer the first (any ext)
  return `/social_shots/${candidates[0]}`;
}

async function main() {
  const json = JSON.parse(await fs.readFile(JSON_PATH, "utf-8"));
  json.postsByProfile = json.postsByProfile || {};
  const profiles = json.profiles || {};

  for (const t of TARGETS) {
    const url = matchProfileUrl(t.platform, t.handle, profiles);
    if (!url) {
      console.log(`(skip) No profile URL found for ${t.platform} ${t.handle}`);
      continue;
    }

    const shotUrl = await findShotByBase(t.base);
    if (!shotUrl) {
      console.log(`(skip) Could not find file for base "${t.base}" in /public/social_shots`);
      continue;
    }

    const byPlat = (json.postsByProfile[t.platform] ||= {});
    const arr = byPlat[url] || [];
    const second = arr[1]; // keep as-is
    byPlat[url] = [shotUrl, second ?? arr[1]];

    console.log(`✓ set FIRST slot → ${t.platform} ${t.handle}: ${shotUrl}`);
  }

  await fs.writeFile(JSON_PATH, JSON.stringify(json, null, 2));
  console.log(`Updated ${path.relative(ROOT, JSON_PATH)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
