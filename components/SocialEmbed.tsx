// components/SocialEmbed.tsx
"use client";
import { useEffect } from "react";

function ensureScript(id: string, src: string) {
  if (!document.getElementById(id)) {
    const s = document.createElement("script");
    s.id = id; s.src = src; s.async = true;
    document.body.appendChild(s);
  }
}

function isImageLike(u: string) {
  return /^\/social_shots\//.test(u) || /\.(png|jpe?g|webp|avif)(\?.*)?$/i.test(u);
}

export default function SocialEmbed({ url }: { url: string }) {
  // If it's a local screenshot image, just show it
  if (isImageLike(url)) {
    return (
      <img
  src={url}
  alt=""
  className="w-full max-w-full h-auto rounded-xl border object-cover"
  loading="lazy"
  decoding="async"
/>

    );
  }

  // Otherwise keep your platform embeds for when you add real permalinks
  useEffect(() => {
    if (url.includes("instagram.com")) ensureScript("ig-embed", "https://www.instagram.com/embed.js");
    if (url.includes("tiktok.com"))    ensureScript("tt-embed", "https://www.tiktok.com/embed.js");
    if (url.includes("facebook.com"))  ensureScript("fb-embed", "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0");
  }, [url]);

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const vid = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
    return <iframe className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${vid}`} allowFullScreen />;
  }
  if (url.includes("instagram.com")) {
    return <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14"></blockquote>;
  }
  if (url.includes("tiktok.com")) {
    return (
      <blockquote className="tiktok-embed" cite={url} style={{ maxWidth: 605, minWidth: 325 }}>
        <a href={url}> </a>
      </blockquote>
    );
  }
  if (url.includes("facebook.com")) {
    return (
<>
  <div id="fb-root" />
  <div className="w-full max-w-full overflow-hidden">
    <div
      className="fb-post"
      data-href={url}
      data-show-text="true"
      /* let the SDK compute width from the parent */
    />
  </div>
</>

    );
  }
  return null;
}
