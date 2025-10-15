// components/SocialEmbed.tsx
"use client";
import { useEffect, ReactNode } from "react";

function ensureScript(id: string, src: string) {
  if (!document.getElementById(id)) {
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }
}

function isImageLike(u: string) {
  return /^\/social_shots\//.test(u) || /\.(png|jpe?g|webp|avif)(\?.*)?$/i.test(u);
}

/** Minimal, responsive well for all embeds/screenshots */
function Well({ children }: { children: ReactNode }) {
  return (
    // Mobile: NO outer frame at all
    // ≥ sm: solid white frame in light, neutral in dark – zero shadows
    <div
      className="
        w-full max-w-full p-0 border-0 shadow-none ring-0 outline-none bg-transparent rounded-none
        sm:p-4
        sm:rounded-2xl
        sm:border sm:border-white dark:sm:border-neutral-800
        sm:bg-white dark:sm:bg-neutral-950
        sm:shadow-none
      "
      style={{ WebkitBoxShadow: "none", boxShadow: "none" }}
    >
      {/* Inner card stays rounded at ALL sizes; no borders/rings/shadows */}
      <div
        className="
          relative w-full overflow-hidden rounded-xl
          bg-white dark:bg-neutral-900
          border-0 ring-0 shadow-none
        "
        style={{
          WebkitBoxShadow: "none",
          boxShadow: "none",
          backgroundColor: "#ffffff",        // hard white in light mode
        }}
      >
        {children}
      </div>
    </div>
  );
}




export default function SocialEmbed({ url }: { url: string }) {
  // Local screenshot → just render the image tightly on mobile
  if (isImageLike(url)) {
    return (
      <Well>
<img
  src={url}
  alt=""
  className="block w-full max-w-full h-auto object-contain sm:object-cover"
  loading="lazy"
  decoding="async"
/>
      </Well>
    );
  }

  // Load platform SDKs only when needed
  useEffect(() => {
    if (url.includes("instagram.com")) ensureScript("ig-embed", "https://www.instagram.com/embed.js");
    if (url.includes("tiktok.com")) ensureScript("tt-embed", "https://www.tiktok.com/embed.js");
    if (url.includes("facebook.com")) ensureScript("fb-embed", "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0");
  }, [url]);

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const vid = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
    return (
      <Well>
        <iframe
          className="w-full aspect-[16/9] rounded-xl"
          src={`https://www.youtube.com/embed/${vid}`}
          allowFullScreen
        />
      </Well>
    );
  }

  // Instagram
  if (url.includes("instagram.com")) {
    return (
      <Well>
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
        />
      </Well>
    );
  }

  // TikTok
  if (url.includes("tiktok.com")) {
    return (
      <Well>
        {/* Let TikTok size to the container; remove fixed min/max widths */}
        <blockquote className="tiktok-embed" cite={url} style={{ width: "100%", maxWidth: "100%" }}>
          <a href={url}> </a>
        </blockquote>
      </Well>
    );
  }

  // Facebook
  if (url.includes("facebook.com")) {
    return (
      <Well>
        <div id="fb-root" />
        <div className="w-full max-w-full overflow-hidden">
          <div
            className="fb-post"
            data-href={url}
            data-show-text="true"
            data-width="auto"
            style={{ maxWidth: "100%" }}
          />
        </div>
      </Well>
    );
  }

  return null;
}
