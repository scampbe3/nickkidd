"use client";
export default function TagFilter({
  tags, active, onChange
}: { tags:string[]; active:string|null; onChange:(t:string|null)=>void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className={`px-3 py-1 border rounded ${!active && "bg-black text-white"}`} onClick={()=>onChange(null)}>All</button>
      {tags.map(t=>(
        <button key={t}
          className={`px-3 py-1 border rounded ${active===t && "bg-black text-white"}`}
          onClick={()=>onChange(t)}>{t}</button>
      ))}
    </div>
  );
}
