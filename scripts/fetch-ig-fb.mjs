// scripts/fetch-ig-fb.mjs
// Usage: node scripts/fetch-ig-fb.mjs
// Targets ONLY facebook + instagram profiles in data/socials.json.
// Strategy: FB Graph picture (if id) -> OG <meta property="og:image"> -> unavatar fallback.
// Saves to /public/social/<platform>-<slug>.<ext> and updates socials.json.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const jsonPath = path.join(ROOT, "data", "socials.json");
const outDir = path.join(ROOT, "public", "social");

const PLATFORMS = ["facebook", "instagram"];

function safeSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "profile";
}
function extFromType(ct) {
  if (!ct) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  return ".jpg";
}
function decodeHtml(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function parseHandle(platform, url) {
  try {
    const u = new URL(url);
    const p = u.pathname.split("/").filter(Boolean);
    if (platform === "instagram") {
      const seg = p[0] ?? "";
      return seg.startsWith("@") ? seg.slice(1) : seg;
    }
    if (platform === "facebook") {
      const id = u.searchParams.get("id");
      if (id) return `id:${id}`;
      // pages/usernames (rare on personal profiles)
      return p[0] ?? "";
    }
    return "";
  } catch {
    return "";
  }
}
async function fetchBuffer(u) {
  const res = await fetch(u, {
    redirect: "follow",
    headers: {
      // Pretend to be a normal browser (helps IG/FB)
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "referer": "https://www.google.com/"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const arr = await res.arrayBuffer();
  const buf = Buffer.from(arr);
  if (!/image\//.test(ct)) throw new Error(`Not image: ${ct}`);
  return { buf, ct, finalUrl: res.url };
}
async function fetchHtml(u) {
  const res = await fetch(u, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "referer": "https://www.google.com/"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return { html, finalUrl: res.url };
}
function extractOgImage(html) {
  // try both orders of attributes
  const m1 = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (m1) return decodeHtml(m1[1]);
  const m2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
  if (m2) return decodeHtml(m2[1]);
  return null;
}

async function saveImageToPublic(imgUrl, fileBase) {
  const { buf, ct } = await fetchBuffer(imgUrl);
  const ext = extFromType(ct);
  const fileName = `${fileBase}${ext}`;
  await fs.writeFile(path.join(outDir, fileName), buf);
  return `/social/${fileName}`;
}

async function processEntry(platform, entry) {
  // normalize entry (string or object)
  if (typeof entry === "string") entry = { url: entry };
  if (entry.avatar && entry.avatar.startsWith("/social/")) return entry; // already has local

  const url = entry.url;
  const handle = parseHandle(platform, url);
  const base = safeSlug(`${platform}-${handle || new URL(url).host}`);

  // 1) Facebook: try public Graph redirect if we have numeric id
  if (platform === "facebook" && handle.startsWith("id:")) {
    const id = handle.slice(3);
    const graphUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512`;
    try {
      entry.avatar = await saveImageToPublic(graphUrl, base);
      console.log(`✓ FB graph: ${url} -> ${entry.avatar}`);
      return entry;
    } catch (e) {
      console.log(`…FB graph failed, will try OG: ${e.message}`);
    }
  }

  // 2) Try OG image from the profile page (works for FB & IG)
  try {
    // Force English page variant helps some meta tags
    const pageUrl = platform === "instagram" ? url.replace(/\/$/, "") + "/?hl=en" : url;
    const { html, finalUrl } = await fetchHtml(pageUrl);
    const og = extractOgImage(html);
    if (og) {
      entry.avatar = await saveImageToPublic(og, base);
      console.log(`✓ ${platform} og:image: ${finalUrl} -> ${entry.avatar}`);
      return entry;
    }
  } catch (e) {
    console.log(`…OG fetch failed for ${platform} ${url}: ${e.message}`);
  }

  // 3) Last resort: unavatar (sometimes blocked for IG/FB, but try)
  try {
    const unavatar = handle
      ? `https://unavatar.io/${platform}/${encodeURIComponent(handle)}`
      : `https://unavatar.io/${encodeURIComponent(url)}`;
    entry.avatar = await saveImageToPublic(unavatar, base);
    console.log(`✓ ${platform} unavatar fallback: ${url} -> ${entry.avatar}`);
    return entry;
  } catch (e) {
    console.warn(`✗ Could not fetch avatar for ${platform} ${url}: ${e.message}`);
  }

  return entry; // no avatar set; ProfileCard will fall back to initials
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const raw = JSON.parse(await fs.readFile(jsonPath, "utf-8"));
  const profiles = raw.profiles || {};

  for (const platform of PLATFORMS) {
    const list = (profiles[platform] || []).map(p => (typeof p === "string" ? { url: p } : p));
    for (let i = 0; i < list.length; i++) {
      list[i] = await processEntry(platform, list[i]);
    }
    profiles[platform] = list;
  }

  raw.profiles = profiles;
  await fs.writeFile(jsonPath, JSON.stringify(raw, null, 2));
  console.log(`\nUpdated ${jsonPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
