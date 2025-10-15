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

/** Minimal, consistent well for all embeds/screenshots */
function Well({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-full rounded-2xl border bg-neutral-950/30 p-2 sm:p-4">
      <div className="relative w-full overflow-hidden rounded-xl bg-neutral-900/40">
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
          className="w-full max-w-full h-auto object-contain sm:object-cover"
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
