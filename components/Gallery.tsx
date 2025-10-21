"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";


import Lightbox from "./Lightbox";
import TagFilter from "./TagFilter";

type Photo = { src: string; alt: string; tags?: string[] };

// Orientation tags we don't want to show as filter chips
const ORIENTATION_TAGS = new Set(["landscape", "portrait"]);

export default function Gallery({ photos }: { photos: Photo[] }) {
  // Collect filterable tags (exclude orientation tags)
  const filterTags = useMemo(() => {
    const all = new Set<string>();
    for (const p of photos) (p.tags ?? []).forEach(t => !ORIENTATION_TAGS.has(t) && all.add(t));
    return Array.from(all).sort();
  }, [photos]);

  const [active, setActive] = useState<string | null>(null);
  const [view, setView] = useState<Photo | null>(null);

  // runtime orientation map (src -> isLandscape)
  const [land, setLand] = useState<Record<string, boolean>>({});
  const setLandscape = useCallback((src: string, w: number, h: number) => {
    const isLandscape = w > h; // simple, good enough
    setLand(prev => (prev[src] === isLandscape ? prev : { ...prev, [src]: isLandscape }));
  }, []);

    // Detect when the grid is exactly 3 columns (lg: 1024px–1279.98px)
  const [isThreeCols, setIsThreeCols] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px) and (max-width: 1279.98px)");
    const update = () => setIsThreeCols(mql.matches);
    update();
    if (mql.addEventListener) mql.addEventListener("change", update);
    else mql.addListener(update);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", update);
      else mql.removeListener(update);
    };
  }, []);


  // filter (ignores orientation tags)
  const filtered = useMemo(() => {
    if (!active) return photos;
    return photos.filter(p => (p.tags ?? []).includes(active));
  }, [photos, active]);

    // When exactly 3 columns, render the final three as [last, second-last, third-last]
  const displayPhotos = useMemo(() => {
    const arr = filtered;
    if (!isThreeCols || arr.length < 3) return arr;
    const n = arr.length;
    const head = arr.slice(0, n - 3);
    return head.concat([arr[n - 1], arr[n - 2], arr[n - 3]]);
  }, [filtered, isThreeCols]);



  return (
    <div className="space-y-6">
      {filterTags.length > 0 && (
        <div>
          <div className="text-sm uppercase tracking-wide text-neutral-500 mb-2">Filter</div>
          <TagFilter tags={filterTags} active={active} onChange={setActive} />
        </div>
      )}

      {/* Grid: 1 / 2 / 3 / 4 columns. Landscape spans full row on <=lg, half row on xl (so max two per row). */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayPhotos.map((p, i) => {
          const hasTagLandscape = (p.tags ?? []).includes("landscape");
          const hasTagPortrait  = (p.tags ?? []).includes("portrait");
          const autoLandscape   = land[p.src];

          // Decide final orientation (manual tag wins, else runtime)
          const isLandscape = hasTagLandscape ? true : hasTagPortrait ? false : !!autoLandscape;

          // Span rules:
          // - Small/medium/lg -> full row if landscape
          // - xl (4 cols)     -> span 2 if landscape (so two can share a row max)
          const spanClass = isLandscape
            ? "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2"
            : "";

return (
  <Tile
    key={p.src + i}
    photo={p}
    spanClass={`overflow-hidden rounded-xl focus:outline-none focus:ring border ${spanClass}`}
    expectLandscape={isLandscape}
    priority={i < 8}
    onClick={() => setView(p)}
    setLandscape={setLandscape}
  />
);


        })}
      </div>

      <Lightbox open={!!view} src={view?.src ?? ""} alt={view?.alt ?? ""} onClose={() => setView(null)} />
    </div>
  );
}

function Tile({
  photo,
  spanClass,
  expectLandscape,
  priority,
  onClick,
  setLandscape,
}: {
  photo: { src: string; alt: string; tags?: string[] };
  spanClass: string;
  expectLandscape: boolean;
  priority: boolean;
  onClick: () => void;
  setLandscape: (src: string, w: number, h: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);

// Safety: if onLoad never fires (rare), reveal after 6s
useEffect(() => {
  const id = setTimeout(() => setLoaded(true), 6000);
  return () => clearTimeout(id);
}, []);


 // Prewarm top images (browser-only) to avoid “piecemeal” decoding lag.
useEffect(() => {
  if (!priority) return;
  if (typeof window === "undefined" || !("Image" in window)) return;
  const img = new window.Image();
  img.src = photo.src;
  // Try to decode ahead of paint (non-blocking)
  // @ts-ignore
  img.decode?.().catch(() => {});
}, [priority, photo.src]);


  const aspect = expectLandscape ? "aspect-[16/9]" : "aspect-[3/4]";

  return (
    <button className={spanClass} onClick={onClick} aria-label={`Open ${photo.alt}`}>
      <div className={`relative w-full ${aspect} transition-opacity duration-200 hover:opacity-85`}>
        {/* Shimmer skeleton behind the image */}
<div
  className="
    absolute inset-0 z-0 rounded-xl
    bg-[linear-gradient(110deg,#eeeeee_8%,#f5f5f5_18%,#eeeeee_33%)]
    dark:bg-[linear-gradient(110deg,#1f1f1f_8%,#272727_18%,#1f1f1f_33%)]
    [background-size:200%_100%] animate-[shimmer_1.2s_infinite]
  "
  style={{ animation: "shimmer 1.2s infinite" }}
/>

{/* Optimized image (Next.js) fills the reserved box and fades in */}
<Image
  src={photo.src}
  alt={photo.alt}
  fill
  sizes="(max-width: 640px) 100vw, 480px"
  priority={priority}
  loading={priority ? "eager" : "lazy"}
  // Paints crisply and decodes sooner than plain <img>
  className={`absolute inset-0 z-10 object-cover transition-opacity duration-300 ${
    loaded ? "opacity-100" : "opacity-0"
  }`}
  onLoadingComplete={(img) => {
    // mark loaded (hide skeleton + show image)
    setLoaded(true);
    // update runtime orientation (keeps your landscape logic working)
    setLandscape(photo.src, img.naturalWidth, img.naturalHeight);
  }}
  // Slight prefetch window so tiles entering view are ready
  // (Next/Image lazy-loads near viewport; this hints importance)
  fetchPriority={priority ? "high" : "auto"}
/>

      </div>
    </button>
  );
}
