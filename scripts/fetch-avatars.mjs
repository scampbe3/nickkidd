// scripts/fetch-avatars.mjs
// Usage: node scripts/fetch-avatars.mjs
// Fetches avatars for profiles in data/socials.json.
// Strategy: unavatar (several forms) -> OG <meta property="og:image"> fallback.
// Saves to /public/social/<platform>-<slug>.<ext> and updates socials.json.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const jsonPath = path.join(ROOT, "data", "socials.json");
const outDir = path.join(ROOT, "public", "social");

const order = ["facebook", "tiktok", "youtube", "instagram"];

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

function parseHandle(platform, url) {
  try {
    const u = new URL(url);
    const p = u.pathname.split("/").filter(Boolean);
    if (platform === "youtube") {
      if (p[0]?.startsWith("@")) return p[0].slice(1);
      if (p[0] === "channel" && p[1]) return p[1];
      return "";
    }
    if (platform === "instagram" || platform === "tiktok") {
      const seg = p[0] ?? "";
      return seg.startsWith("@") ? seg.slice(1) : seg;
    }
    if (platform === "facebook") {
      const id = u.searchParams.get("id");
      if (id) return `id:${id}`;
      return p[0] ?? "";
    }
    return "";
  } catch {
    return "";
  }
}

function candidateUnavatarUrls(platform, url, handle) {
  const list = [];
  if (handle) {
    list.push(`https://unavatar.io/${platform}/${encodeURIComponent(handle)}`);
    if (platform === "youtube" && !handle.startsWith("@"))
      list.push(`https://unavatar.io/youtube/${encodeURIComponent("@" + handle)}`);
    if (platform === "facebook" && handle.startsWith("id:"))
      list.push(`https://unavatar.io/facebook/${encodeURIComponent(handle.slice(3))}`);
  }
  list.push(`https://unavatar.io/${encodeURIComponent(url)}`); // full URL fallback
  return list;
}

async function fetchBuffer(u) {
  const res = await fetch(u, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "sec-fetch-mode": "no-cors"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (!/image\//.test(ct)) throw new Error(`Not image: ${ct}`);
  return { buf, ct };
}

async function fetchText(u) {
  const res = await fetch(u, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const html = await res.text();
  return { html, ct, finalUrl: res.url };
}

function extractOgImage(html) {
  // very simple OG parser
  const m = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*>/i);
  if (!m) return null;
  const tag = m[0];
  const cm = tag.match(/content=["']([^"']+)["']/i);
  return cm ? cm[1] : null;
}

async function saveAvatarToFile(url, fileBase) {
  const { buf, ct } = await fetchBuffer(url);
  const ext = extFromType(ct);
  const fileName = `${fileBase}${ext}`;
  return { buf, fileName };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const raw = JSON.parse(await fs.readFile(jsonPath, "utf-8"));

  const profiles = raw.profiles || {};
  for (const platform of order) {
    const items = (profiles[platform] || []).map(p => (typeof p === "string" ? { url: p } : p));

    for (let i = 0; i < items.length; i++) {
      const entry = items[i];
      if (entry.avatar && entry.avatar.startsWith("/social/")) continue; // already done

      const url = entry.url;
      const handle = parseHandle(platform, url);
      const slug = safeSlug(`${platform}-${handle || new URL(url).host}`);

      const tryUrls = [
        ...candidateUnavatarUrls(platform, url, handle) // 1) unavatar variants
      ];

      let savedPath = null;

      // Try unavatar first (several candidates)
      for (const cu of tryUrls) {
        try {
          const { buf, fileName } = await saveAvatarToFile(cu, slug);
          await fs.writeFile(path.join(outDir, fileName), buf);
          entry.avatar = `/social/${fileName}`;
          savedPath = entry.avatar;
          console.log(`✓ ${platform} via unavatar: ${url} -> ${entry.avatar}`);
          break;
        } catch (_) {}
      }

      // Fallback: fetch page HTML and extract og:image
      if (!savedPath) {
        try {
          const { html, finalUrl } = await fetchText(url);
          const og = extractOgImage(html);
          if (!og) throw new Error("no og:image");
          const { buf, fileName } = await saveAvatarToFile(og, slug);
          await fs.writeFile(path.join(outDir, fileName), buf);
          entry.avatar = `/social/${fileName}`;
          savedPath = entry.avatar;
          console.log(`✓ ${platform} via og:image: ${finalUrl} -> ${entry.avatar}`);
        } catch (e) {
          console.warn(`✗ Could not fetch avatar for ${platform} ${url}: ${e.message}`);
        }
      }

      items[i] = entry;
    }
    profiles[platform] = items;
  }

  raw.profiles = profiles;
  await fs.writeFile(jsonPath, JSON.stringify(raw, null, 2));
  console.log(`\nUpdated ${jsonPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
