// scripts/wire-second-slots.mjs
// Usage: node scripts/wire-second-slots.mjs
// Takes the six newest "Screenshot*" files in /public/social_shots and assigns
// them as the SECOND post image (index 1) for each profile in the specified order.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SHOTS_DIR = path.join(ROOT, "public", "social_shots");
const JSON_PATH = path.join(ROOT, "data", "socials.json");

const ORDER = [
  { platform: "instagram", handle: "nickckidd" },            // personal IG
  { platform: "instagram", handle: "nickkvideos" },          // business IG
  { platform: "facebook",  handle: "100094903872941" },      // FB id
  { platform: "tiktok",    handle: "nickkvideos1" },         // TikTok
  { platform: "youtube",   handle: "nickkvideos" },          // YT main
  { platform: "youtube",   handle: "nix_remix" },            // YT second
];

const EXT_OK = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const norm = (s) => s.toLowerCase();

function stableName({ platform, handle }, srcName) {
  const ext = path.extname(srcName).toLowerCase() || ".jpg";
  return `${platform}-${handle}-2${ext}`;
}

function matchProfileUrl(platform, handle, profiles) {
  const list = (profiles[platform] || []).map((p) =>
    typeof p === "string" ? { url: p } : p
  );
  // Find by handle/ID presence in URL
  const h = norm(handle);
  for (const p of list) {
    const u = norm(p.url);
    if (platform === "facebook") {
      if (u.includes("facebook.com") && u.includes(h)) return p.url;
    } else if (platform === "youtube") {
      if (u.includes("youtube.com") && (u.includes(`@${h}`) || u.includes(h)))
        return p.url;
    } else if (platform === "instagram" || platform === "tiktok") {
      if (u.includes(platform) && u.includes(h)) return p.url;
    }
  }
  return null;
}

async function newestScreenshots(dir, n = 6) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (!EXT_OK.has(ext)) continue;
    if (!/^screenshot/i.test(e.name)) continue;
    const abs = path.join(dir, e.name);
    const stat = await fs.stat(abs);
    files.push({ name: e.name, mtime: stat.mtimeMs });
  }
  files.sort((a, b) => b.mtime - a.mtime); // newest first
  return files.slice(0, n).reverse();      // keep chronological order you mentioned
}

async function main() {
  // 1) pick the six screenshots
  const picks = await newestScreenshots(SHOTS_DIR, ORDER.length);
  if (picks.length < ORDER.length) {
    console.log(`Found ${picks.length} screenshot(s). Need ${ORDER.length}. Place them in /public/social_shots and retry.`);
    return;
  }

  // 2) load socials.json
  const json = JSON.parse(await fs.readFile(JSON_PATH, "utf-8"));
  json.postsByProfile = json.postsByProfile || {};
  const profiles = json.profiles || {};

  // 3) map each screenshot to its profile (in the specified order)
  for (let i = 0; i < ORDER.length; i++) {
    const map = ORDER[i];
    const shot = picks[i];
    const stable = stableName(map, shot.name);

    // Copy/overwrite to a stable filename
    await fs.copyFile(path.join(SHOTS_DIR, shot.name), path.join(SHOTS_DIR, stable));

    const targetUrl = matchProfileUrl(map.platform, map.handle, profiles);
    if (!targetUrl) {
      console.log(`(skip) No profile URL found for ${map.platform} ${map.handle}`);
      continue;
    }

    // Ensure nested object exists
    json.postsByProfile[map.platform] = json.postsByProfile[map.platform] || {};
    const arr = json.postsByProfile[map.platform][targetUrl] || [];

    // Leave first image untouched; set/replace the second slot
    const second = `/social_shots/${stable}`;
    const first = arr[0];
    json.postsByProfile[map.platform][targetUrl] =
      first ? [first, second] : [second, second]; // if no first, duplicate so both wells fill

    console.log(`✓ wired 2nd slot → ${map.platform} ${map.handle}: ${second}`);
  }

  // 4) save
  await fs.writeFile(JSON_PATH, JSON.stringify(json, null, 2));
  console.log(`Updated ${path.relative(ROOT, JSON_PATH)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
