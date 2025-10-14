"use client";
import { useMemo, useState } from "react";

type Platform = "facebook" | "tiktok" | "youtube" | "instagram";

const brand: Record<Platform, { name: string; gradient: string; icon: JSX.Element }> = {
  instagram: {
    name: "Instagram",
    gradient: "from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
    icon: <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10a5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6a2.8 2.8 0 0 0 0-5.6ZM18 6.5a1 1 0 1 1 0 2a1 1 0 0 1 0-2Z"/></svg>,
  },
  facebook: {
    name: "Facebook",
    gradient: "from-[#1877F2] to-[#0e52ac]",
    icon: <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="currentColor" d="M13.5 9H16V6h-2.5C11.6 6 11 7.2 11 8.8V10H9v3h2v7h3v-7h2.2l.3-3H14v-1c0-.6.2-1 1-1Z"/></svg>,
  },
  tiktok: {
    name: "TikTok",
    gradient: "from-[#25F4EE] via-[#000000] to-[#FE2C55]",
    icon: <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="currentColor" d="M18.5 7.3c-1.7-.6-3-1.8-3.6-3.4h-2.8v11.5a3 3 0 1 1-2.4-2.9v-2.9a6 6 0 1 0 4.8 5.9V9.4c1 .9 2.3 1.5 4 1.6V7.4c0-.1 0-.1-.1-.1Z"/></svg>,
  },
  youtube: {
    name: "YouTube",
    gradient: "from-[#ff0000] to-[#b80000]",
    icon: <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="currentColor" d="M23 7.5s-.2-1.6-.8-2.3c-.8-.8-1.8-.8-2.2-.9C16.8 4 12 4 12 4s-4.8 0-8 .3c-.4 0-1.4.1-2.2.9C1.2 5.9 1 7.5 1 7.5S.8 9.4.8 11.3v1.4C.8 14.6 1 16.5 1 16.5s.2 1.6.8 2.3c.8.8 1.8.8 2.3.9C7.2 20 12 20 12 20s4.8 0 8-.3c.5 0 1.5-.1 2.3-.9c.6-.7.8-2.3.8-2.3s.2-1.9.2-3.8v-1.4c0-1.9-.1-3.8-.3-4.8ZM9.8 15.6V8.4l6.4 3.6l-6.4 3.6Z"/></svg>,
  },
};

const defaultMeta = {
  name: "Profile",
  gradient: "from-neutral-700 to-neutral-900",
  icon: <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><circle cx="12" cy="8" r="4" fill="currentColor" /><path d="M4 20a8 8 0 0 1 16 0Z" fill="currentColor" /></svg>,
};

function parseHandle(platform: Platform, url: string): string {
  try {
    const u = new URL(url);
    const p = u.pathname.split("/").filter(Boolean);
    if (platform === "youtube") {
      if (p[0]?.startsWith("@")) return p[0].slice(1);     // handle form
      if (p[0] === "channel" && p[1]) return p[1];          // channel id form
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

function initials(name: string) {
  const parts = name.replace(/[@_]/g, " ").trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "•";
}

export default function ProfileCard({
  platform,
  url,
  label,
  avatar,
  size = "md",
}: {
  platform: Platform;
  url: string;
  label?: string;
  avatar?: string;
  size?: "sm" | "md" | "lg";
}) {

  const meta = (brand as any)[platform] ?? defaultMeta;

  const sz = {
    header: size === "lg" ? "px-6 py-3" : size === "sm" ? "px-3 py-1.5" : "px-4 py-2",
    body:   size === "lg" ? "p-6"       : size === "sm" ? "p-3"         : "p-4",
    avatar: size === "lg" ? "w-16 h-16" : size === "sm" ? "w-10 h-10"   : "w-12 h-12",
    name:   size === "lg" ? "text-lg"   : size === "sm" ? "text-sm"     : "text-base",
  };


  const handle = useMemo(() => parseHandle(platform, url), [platform, url]);
  const displayName = label || (handle && (platform === "facebook" && handle.startsWith("id:") ? "" : handle)) || new URL(url).host.replace("www.", "") || meta.name;

  // Try multiple avatar sources in order:
  const candidates = useMemo(() => {
    const list: string[] = [];
    if (avatar) list.push(avatar); // manual override first
    if (handle) {
      list.push(`https://unavatar.io/${platform}/${encodeURIComponent(handle)}`);
      if (platform === "youtube") list.push(`https://unavatar.io/${platform}/${encodeURIComponent("@"+handle)}`);
      if (platform === "facebook" && handle.startsWith("id:")) {
        list.push(`https://unavatar.io/facebook/${encodeURIComponent(handle.slice(3))}`);
      }
    }
    list.push(`https://unavatar.io/${encodeURIComponent(url)}`); // full URL fallback
    return list;
  }, [platform, handle, url, avatar]);

  const [index, setIndex] = useState(0);
  const [showImg, setShowImg] = useState(true);
  const src = candidates[index];

    return (
    <a href={url} target="_blank" rel="noreferrer"
className="block rounded-2xl border overflow-hidden hover:shadow transition bg-surface">      {/* header: replace px/py with sz.header */}
      <div className={`text-white bg-gradient-to-r ${meta.gradient} flex items-center gap-2 ${sz.header}`}>
        <span className="opacity-90">{meta.icon}</span>
        <span className="text-xs uppercase tracking-wider">Follow on {meta.name}</span>
      </div>

      {/* body: replace p-4 with sz.body */}
      <div className={`${sz.body} flex items-center gap-4`}>
        {showImg ? (
          <img
            src={src}
            alt={`${meta.name} avatar`}
            className={`${sz.avatar} rounded-full object-cover border`}
            onError={() => {
              if (index < candidates.length - 1) setIndex(i => i + 1);
              else setShowImg(false);
            }}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`${sz.avatar} rounded-full grid place-items-center border bg-gradient-to-br from-neutral-800 to-neutral-700 text-white text-sm font-semibold`}>
            {initials(displayName)}
          </div>
        )}

        <div className="min-w-0">
          {/* use sz.name for the display name */}
          <div className={`${sz.name} font-medium truncate`}>{displayName}</div>
          <div className="text-xs text-neutral-500 break-all truncate">{url}</div>
        </div>
        <span className="ml-auto text-sm underline whitespace-nowrap">Open</span>
      </div>
    </a>
  );
}
