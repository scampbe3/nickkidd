// components/SocialEmbed.tsx
"use client";
import { useEffect } from "react";

// NEW: one responsive size rule for ALL previews
// - mobile: w-full (prevents horizontal scroll on tiny screens)
// - sm and up: exactly 480px wide, centered
const fixed = "mx-auto w-full sm:w-[480px] max-w-[480px]";

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

export default function SocialEmbed({ url }: { url: string }) {
  // Local screenshots
  if (isImageLike(url)) {
    return (
      <div className={fixed}>
        <img
          src={url}
          alt=""
          className="w-full h-auto rounded-xl border object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  // Load embed scripts as needed
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

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const vid = url.includes("v=")
      ? url.split("v=")[1].split("&")[0]
      : url.split("/").pop();
    return (
      <div className={`${fixed} aspect-[9/16] sm:aspect-[480/270]`}>
        <iframe
          className="w-full h-full rounded-xl"
          src={`https://www.youtube.com/embed/${vid}`}
          allowFullScreen
        />
      </div>
    );
  }

  // Instagram
  if (url.includes("instagram.com")) {
    return (
      <div className={fixed}>
        <blockquote
          className="instagram-media w-full"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
        />
      </div>
    );
  }

  // TikTok
  if (url.includes("tiktok.com")) {
    return (
      <div className={fixed}>
        <blockquote
          className="tiktok-embed w-full"
          cite={url}
          style={{ maxWidth: 480, minWidth: 320 }}
        >
          <a href={url}> </a>
        </blockquote>
      </div>
    );
  }

  // Facebook
  if (url.includes("facebook.com")) {
    return (
      <div className={fixed}>
        <div id="fb-root" />
        <div className="fb-post w-full" data-href={url} data-show-text="true" />
      </div>
    );
  }

  return null;
}
