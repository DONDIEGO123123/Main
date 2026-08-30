"use client";
import { useCompare } from "@/lib/compare";

/** Small toggle that adds a product to the comparison tray. */
export default function CompareButton({ id }: { id: string }) {
  const { ids, toggle, full } = useCompare();
  const active = ids.includes(id);

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      disabled={!active && full}
      aria-label="השוואה"
      title={active ? "הסרה מהשוואה" : "הוספה להשוואה"}
      className={`h-9 w-9 grid place-items-center rounded-full backdrop-blur border transition disabled:opacity-30 ${
        active ? "bg-gold text-ink border-gold" : "bg-black/40 border-white/20 text-white hover:text-gold"
      }`}
    >
      ⚖
    </button>
  );
}
