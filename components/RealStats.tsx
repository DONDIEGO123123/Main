"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Real figures only — orders, average rating, review count.
 * Each cell hides itself until the underlying data actually exists.
 */
export default function RealStats() {
  const [stats, setStats] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    (async () => {
      const s = createClient();
      const [orders, reviews] = await Promise.all([
        s.from("orders").select("id", { count: "exact", head: true }).neq("status", "cancelled"),
        s.from("reviews").select("rating").eq("is_approved", true),
      ]);

      const out: { label: string; value: string }[] = [];

      const orderCount = orders.count ?? 0;
      if (orderCount > 0) out.push({ label: "הזמנות", value: `${orderCount}` });

      const rs = ((reviews.data ?? []) as { rating: number }[]).map((r) => r.rating);
      if (rs.length > 0) {
        const avg = rs.reduce((a, b) => a + b, 0) / rs.length;
        out.push({ label: "דירוג ממוצע", value: `${avg.toFixed(1)} ★` });
        out.push({ label: "ביקורות", value: `${rs.length}` });
      }

      setStats(out);
    })();
  }, []);

  if (stats.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 -mt-10 relative z-10">
      <div className={`glass-gold grid gap-px text-center py-8 ${
        stats.length === 3 ? "grid-cols-3" : stats.length === 2 ? "grid-cols-2" : "grid-cols-1"
      }`}>
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-3xl font-black gold-text tabular-nums">{s.value}</p>
            <p className="text-smoke text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
