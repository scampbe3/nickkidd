// scripts/pin-avatars.mjs
// Usage: node scripts/pin-avatars.mjs
// - Ensures a local TikTok avatar exists
// - Updates data/socials.json to point FB/IG/YT/TikTok at local files

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const JSON_PATH = path.join(ROOT, "data", "socials.json");
const OUT_DIR   = path.join(ROOT, "public", "social");

// local files you already added
const IG_NICKKVIDEOS = "/social/instagram_nickkvideos_pfp.jpg";
const FB_PFP         = "/social/facebook_pfp.jpg";

// we’ll create/download this once and reuse it
const TT_LOCAL       = "/social/tiktok_nickkvideos1_pfp.jpg";
const TT_SOURCE_URL  = "https://unavatar.io/tiktok/nickkvideos1";

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function download(url, destAbs) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destAbs, buf);
}

function normalize(list) {
  return (list || []).map((p) => (typeof p === "string" ? { url: p } : p));
}

async function main() {
  await ensureDir(OUT_DIR);

  // 1) ensure TikTok avatar file exists locally
  const ttAbs = path.join(ROOT, TT_LOCAL.slice(1));
  if (!(await exists(ttAbs))) {
    console.log(`Downloading TikTok avatar -> ${TT_LOCAL}`);
    await download(TT_SOURCE_URL, ttAbs);
  } else {
    console.log(`Found ${TT_LOCAL}`);
  }

  // 2) load socials.json
  const raw = JSON.parse(await fs.readFile(JSON_PATH, "utf-8"));
  raw.profiles = raw.profiles || {};

  const ig = normalize(raw.profiles.instagram);
  const fb = normalize(raw.profiles.facebook);
  const yt = normalize(raw.profiles.youtube);
  const tt = normalize(raw.profiles.tiktok);

  // 3) apply local avatar paths
  // Facebook (use your downloaded file + friendly label)
  fb.forEach((p) => {
    if (p.url.includes("facebook.com")) {
      p.avatar = FB_PFP;
      p.label = p.label || "Nick Kidd";
    }
  });

  // Instagram
  ig.forEach((p) => {
    if (p.url.includes("instagram.com/nickkvideos")) {
      p.avatar = IG_NICKKVIDEOS;          // your local IG file
      p.label = p.label || "@nickkvideos";
    } else if (p.url.includes("instagram.com/nickckidd")) {
      p.avatar = TT_LOCAL;                 // reuse TikTok avatar
      p.label = p.label || "@nickckidd";
    }
  });

  // TikTok (pin to local)
  tt.forEach((p) => {
    if (p.url.includes("tiktok.com/@nickkvideos1")) {
      p.avatar = TT_LOCAL;
      p.label = p.label || "@nickkvideos1";
    }
  });

  // YouTube: reuse TikTok avatar for @nickkvideos
  yt.forEach((p) => {
    if (p.url.includes("youtube.com/@nickkvideos")) {
      p.avatar = TT_LOCAL;
      p.label = p.label || "@nickkvideos";
    }
  });

  // 4) write back
  raw.profiles.instagram = ig;
  raw.profiles.facebook  = fb;
  raw.profiles.youtube   = yt;
  raw.profiles.tiktok    = tt;

  await fs.writeFile(JSON_PATH, JSON.stringify(raw, null, 2));
  console.log(`Updated ${JSON_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
