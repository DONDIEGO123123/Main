"use client";
import Link from "next/link";
import { useCompare } from "@/lib/compare";
import { useFlag } from "@/lib/flags";

/** Sticky tray showing how many products are queued for comparison. */
export default function CompareBar() {
  const { ids, clear } = useCompare();
  const enabled = useFlag("compare");
  if (!enabled || ids.length < 2) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 z-40 glass-gold p-3 flex items-center gap-3 max-w-md mx-auto">
      <span className="text-xl">⚖️</span>
      <span className="flex-1 text-sm">{ids.length} מוצרים להשוואה</span>
      <Link href="/compare" className="btn-gold px-4 py-2 text-sm shrink-0">השווה</Link>
      <button onClick={clear} aria-label="ניקוי" className="text-smoke text-lg shrink-0">×</button>
    </div>
  );
}
