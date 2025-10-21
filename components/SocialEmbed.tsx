"use client";

import { useEffect, useState } from "react";
import Skeleton from "./Skeleton";

// Desktop: exactly 480px wide and centered; Mobile: fill width.
const fixed = "mx-auto w-full sm:w-[480px] max-w-[480px]";

// Vertical aspect (we standardized on vertical previews).
const verticalAR = "aspect-[9/16]";

// Simple helper for local screenshots/static images
function isImageLike(u: string) {
  return /^\/social_shots\//.test(u) || /\.(png|jpe?g|webp|avif)(\?.*)?$/i.test(u);
}

function ensureScript(id: string, src: string) {
  if (!document.getElementById(id)) {
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }
}

export default function SocialEmbed({ url }: { url: string }) {
  // ---------- Local screenshots (fast path) ----------
  if (isImageLike(url)) {
    const [loaded, setLoaded] = useState(false);

    return (
<div className={`${fixed} relative ${verticalAR} transition-opacity duration-200 hover:opacity-85`}>
        {/* Skeleton placeholder that fully matches the final box */}
        {!loaded && <Skeleton className="absolute inset-0" />}
        {/* Actual image placed absolutely to occupy the reserved box */}
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full object-cover rounded-xl border"
        />
      </div>
    );
  }

  // Ensure provider embed scripts
  useEffect(() => {
    if (url.includes("instagram.com"))
      ensureScript("ig-embed", "https://www.instagram.com/embed.js");
    if (url.includes("tiktok.com"))
      ensureScript("tt-embed", "https://www.tiktok.com/embed.js");
    if (url.includes("facebook.com"))
      ensureScript(
        "fb-embed",
        "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0"
      );
  }, [url]);

  // ---------- YouTube ----------
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const vid = url.includes("v=")
      ? url.split("v=")[1].split("&")[0]
      : url.split("/").pop();
    const [loaded, setLoaded] = useState(false);

    // On desktop we still stick to 480px width; the height will be 270 (16:9).
    return (
<div className={`${fixed} relative sm:aspect-[16/9] ${verticalAR} sm:!aspect-[16/9] transition-opacity duration-200 hover:opacity-85`}>
        {!loaded && <Skeleton className="absolute inset-0" />}
        <iframe
          className="absolute inset-0 h-full w-full rounded-xl"
          src={`https://www.youtube.com/embed/${vid}`}
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />
      </div>
    );
  }

  // ---------- Instagram ----------
  if (url.includes("instagram.com")) {
    // We can’t easily detect load completion from their script, so show a reserved box.
    return (
<div className={`${fixed} relative ${verticalAR} transition-opacity duration-200 hover:opacity-85`}>
        <Skeleton className="absolute inset-0" />
        <blockquote
          className="instagram-media w-full absolute inset-0"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
        />
      </div>
    );
  }

  // ---------- TikTok ----------
  if (url.includes("tiktok.com")) {
    return (
<div className={`${fixed} relative ${verticalAR} transition-opacity duration-200 hover:opacity-85`}>
        <Skeleton className="absolute inset-0" />
        <blockquote
          className="tiktok-embed w-full absolute inset-0"
          cite={url}
          style={{ maxWidth: 480, minWidth: 320 }}
        >
          <a href={url}> </a>
        </blockquote>
      </div>
    );
  }

  // ---------- Facebook ----------
  if (url.includes("facebook.com")) {
    return (
<div className={`${fixed} relative ${verticalAR} transition-opacity duration-200 hover:opacity-85`}>
        <Skeleton className="absolute inset-0" />
        <div id="fb-root" />
        <div className="fb-post w-full absolute inset-0" data-href={url} data-show-text="true" />
      </div>
    );
  }

  return null;
}
