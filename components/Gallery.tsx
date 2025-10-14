"use client";
import { useMemo, useState, useCallback } from "react";
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

  // filter (ignores orientation tags)
  const filtered = useMemo(() => {
    if (!active) return photos;
    return photos.filter(p => (p.tags ?? []).includes(active));
  }, [photos, active]);

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
        {filtered.map((p, i) => {
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
            <button
              key={i}
              className={`overflow-hidden rounded-xl focus:outline-none focus:ring border ${spanClass}`}
              onClick={() => setView(p)}
              aria-label={`Open ${p.alt}`}
            >
              {/* Use plain <img> for prototype; onLoad sets auto orientation */}
              <img
                src={p.src}
                alt={p.alt}
                className="w-full h-auto object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  setLandscape(p.src, img.naturalWidth, img.naturalHeight);
                }}
              />
            </button>
          );
        })}
      </div>

      <Lightbox open={!!view} src={view?.src ?? ""} alt={view?.alt ?? ""} onClose={() => setView(null)} />
    </div>
  );
}
