// components/ThemeToggle.tsx
"use client";
import { useEffect, useState } from "react";

type Mode = "dark" | "light";

/**
 * Props:
 *  - inline: render without fixed positioning (we use this in Header)
 *  - sizePx: visual bounding box (height & width of the *container*) — default 32
 */
export default function ThemeToggle({ inline = false, sizePx = 32 }: { inline?: boolean; sizePx?: number }) {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Mode) || "dark";
    setMode(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
  }, [mode]);

  const isLight = mode === "light";

  // Track is centered inside a square box of sizePx x sizePx
  const trackH = Math.max(18, Math.round(sizePx * 0.56)); // compact visual height
  const trackW = Math.max(32, Math.round(sizePx));        // about same width as icon
  const knob = trackH - 6;
  const xOn = trackW - knob - 6;

  return (
    <div className={inline ? "flex flex-col items-end" : "fixed top-4 right-4"}>
      <span className="text-[11px] tracking-wide mb-1 opacity-80">
        {isLight ? "Light Mode" : "Dark Mode"}
      </span>

      <div style={{ width: sizePx, height: sizePx }} className="relative">
        <button
          aria-label="Toggle color mode"
          onClick={() => setMode(isLight ? "dark" : "light")}
          className={[
            "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2",
            "relative rounded-full border transition-colors duration-200",
            isLight ? "bg-white border-black" : "bg-black border-white",
          ].join(" ")}
          style={{ width: trackW, height: trackH }}
        >
          <span
            className="absolute top-[3px] left-[3px] rounded-full transition-transform duration-200"
            style={{
              width: knob,
              height: knob,
              transform: isLight ? `translateX(${xOn}px)` : "translateX(0)",
              backgroundColor: isLight ? "black" : "white",
            }}
          />
        </button>
      </div>
    </div>
  );
}
