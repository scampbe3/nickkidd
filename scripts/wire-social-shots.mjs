// scripts/wire-social-shots.mjs
// Usage: node scripts/wire-social-shots.mjs
// Maps local screenshots in /public/social_shots to profiles in data/socials.json

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SHOTS_DIR = path.join(ROOT, "public", "social_shots");
const JSON_PATH = path.join(ROOT, "data", "socials.json");

const PLATFORMS = ["facebook", "tiktok", "youtube", "instagram"];
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// --- helpers ---
const norm = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function parseHandle(platform, url) {
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean);
    if (platform === "youtube") {
      if (segs[0]?.startsWith("@")) return segs[0].slice(1);
      if (segs[0] === "channel" && segs[1]) return segs[1];
      return u.host.replace(/^www\./, "");
    }
    if (platform === "instagram" || platform === "tiktok") {
      const s = segs[0] || "";
      return s.startsWith("@") ? s.slice(1) : s || u.host.replace(/^www\./, "");
    }
    if (platform === "facebook") {
      const id = u.searchParams.get("id");
      if (id) return `id-${id}`;
      return segs[0] || u.host.replace(/^www\./, "");
    }
  } catch {}
  return "profile";
}

function scoreMatch({ platNorm, handleNorm }, fileBase) {
  // higher is better
  let s = 0;
  if (fileBase === `${platNorm}-${handleNorm}`) s += 100;
  if (fileBase.startsWith(`${platNorm}-${handleNorm}`)) s += 90;
  if (fileBase.includes(handleNorm)) s += 70;
  if (fileBase.startsWith(platNorm)) s += 40;
  if (fileBase.includes(platNorm)) s += 20;
  return s;
}

async function listShots() {
  try {
    const names = await fs.readdir(SHOTS_DIR);
    return names
      .filter((n) => exts.has(path.extname(n).toLowerCase()))
      .map((n) => ({
        name: n,
        base: norm(n.replace(path.extname(n), "")),
        url: `/social_shots/${n}`,
      }));
  } catch {
    return [];
  }
}

async function main() {
  const shots = await listShots(); // [{name, base, url}]
  if (!shots.length) {
    console.log("No images found in /public/social_shots");
    return;
  }

  const json = JSON.parse(await fs.readFile(JSON_PATH, "utf-8"));
  json.postsByProfile = json.postsByProfile || {};

  const profiles = json.profiles || {};

  for (const platform of PLATFORMS) {
    const list = (profiles[platform] || []).map((p) =>
      typeof p === "string" ? { url: p } : p
    );
    if (!list.length) continue;

    json.postsByProfile[platform] = json.postsByProfile[platform] || {};

    for (const p of list) {
      const handle = parseHandle(platform, p.url);
      const platNorm = norm(platform);
      const handleNorm = norm(handle);

      // rank candidate screenshots by relevance
      const ranked = shots
        .map((f) => ({ ...f, score: scoreMatch({ platNorm, handleNorm }, f.base) }))
        .filter((f) => f.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

      if (ranked.length === 0) {
        console.log(`(no match) ${platform} ${p.url}  (handle: ${handle})`);
        continue;
      }

      // take top 2; if only one, duplicate the first so both wells fill
      const chosen = ranked.slice(0, 2).map((f) => f.url);
      if (chosen.length === 1) chosen.push(chosen[0]);

      json.postsByProfile[platform][p.url] = chosen;
      console.log(`✓ wired ${platform} ${handle} -> ${chosen.join(", ")}`);
    }
  }

  await fs.writeFile(JSON_PATH, JSON.stringify(json, null, 2));
  console.log(`Updated ${path.relative(ROOT, JSON_PATH)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
