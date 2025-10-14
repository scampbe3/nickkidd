"use client";
import { useEffect } from "react";

export default function Lightbox({
  open, src, alt, onClose
}: { open:boolean; src:string; alt:string; onClose:()=>void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
         onClick={onClose} role="dialog" aria-modal>
      <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] rounded-xl" />
    </div>
  );
}
