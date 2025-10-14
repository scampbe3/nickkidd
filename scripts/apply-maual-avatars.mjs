// scripts/apply-manual-avatars.mjs
// Usage: node scripts/apply-manual-avatars.mjs
// - Ensures a local TikTok avatar exists (downloads from unavatar once)
// - Updates data/socials.json so FB + IG(nickkvideos) use your files, and
//   YT(@nickkvideos) + IG(@nickckidd) + TikTok(@nickkvideos1) reuse the TikTok file.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const jsonPath = path.join(ROOT, "data", "socials.json");
const outDir  = path.join(ROOT, "public", "social");

// your filenames
const FILES = {
  igNickkvideos: "/social/instagram_nickkvideos_pfp.jpg",
  fbNick: "/social/facebook_pfp.jpg",
  ttNickkvideos1: "/social/tiktok_nickkvideos1_pfp.jpg" // will create/download if missing
};

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function download(url, outFile) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
}

function normalizeProfilesBlock(block) {
  // convert strings to objects {url}
  return (block || []).map((p) => (typeof p === "string" ? { url: p } : p));
}

async function main() {
  await ensureDir(outDir);

  // 1) Make sure the TikTok avatar file exists locally
  const ttLocalAbs = path.join(ROOT, FILES.ttNickkvideos1.slice(1));
  if (!(await fileExists(ttLocalAbs))) {
    const unavatarURL = "https://unavatar.io/tiktok/nickkvideos1";
    console.log(`Downloading TikTok avatar -> ${FILES.ttNickkvideos1}`);
    await download(unavatarURL, ttLocalAbs);
  }

  // 2) Read and update socials.json
  const raw = JSON.parse(await fs.readFile(jsonPath, "utf-8"));
  raw.profiles = raw.profiles || {};

  const igList = normalizeProfilesBlock(raw.profiles.instagram);
  const fbList = normalizeProfilesBlock(raw.profiles.facebook);
  const ttList = normalizeProfilesBlock(raw.profiles.tiktok);
  const ytList = normalizeProfilesBlock(raw.profiles.youtube);

  // Facebook: use your downloaded file
  fbList.forEach((p) => {
    if (p.url.includes("facebook.com")) {
      p.avatar = FILES.fbNick;
      p.label = p.label || "Nick Kidd";
    }
  });

  // Instagram:
  igList.forEach((p) => {
    if (p.url.includes("instagram.com/nickkvideos")) {
      p.avatar = FILES.igNickkvideos;
      p.label = p.label || "@nickkvideos";
    } else if (p.url.includes("instagram.com/nickckidd")) {
      p.avatar = FILES.ttNickkvideos1; // reuse TikTok avatar
      p.label = p.label || "@nickckidd";
    }
  });

  // TikTok: pin to local file
  ttList.forEach((p) => {
    if (p.url.includes("tiktok.com/@nickkvideos1")) {
      p.avatar = FILES.ttNickkvideos1;
      p.label = p.label || "@nickkvideos1";
    }
  });

  // YouTube: set @nickkvideos to reuse TikTok avatar (nix_remix already looks good)
  ytList.forEach((p) => {
    if (p.url.includes("youtube.com/@nickkvideos")) {
      p.avatar = FILES.ttNickkvideos1;
      p.label = p.label || "@nickkvideos";
    }
  });

  // write back
  raw.profiles.instagram = igList;
  raw.profiles.facebook  = fbList;
  raw.profiles.tiktok    = ttList;
  raw.profiles.youtube   = ytList;

  await fs.writeFile(jsonPath, JSON.stringify(raw, null, 2));
  console.log(`Updated ${jsonPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
