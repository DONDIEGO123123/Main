"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadFunnel, loadFlags, productPerformance,
         type FunnelStep, type Flag, type ProductPerf } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Control centre (#44): what needs attention, the funnel, and product performance. */
export default function AdminControl() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [perf, setPerf] = useState<ProductPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadFlags(), loadFunnel(30), productPerformance()])
      .then(([f, fn, p]) => {
        setFlags(f); setFunnel(fn); setPerf(p.slice(0, 10)); setLoading(false);
      });
  }, []);

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">מרכז בקרה</h1>

      {/* What needs attention (#36, #44) */}
      <section className="glass p-5">
        <h2 className="font-semibold mb-4">🚨 מה דורש טיפול</h2>
        {flags.length === 0 ? (
          <p className="text-emerald-400 text-sm">🟢 הכל תחת שליטה — אין משימות פתוחות</p>
        ) : (
          <div className="space-y-2">
            {flags.map((f, i) => (
              <Link key={i} href={f.link}
                className={`flex items-center gap-3 p-3 rounded-xl border transition hover:border-gold/40 ${
                  f.level === "red"
                    ? "border-red-400/30 bg-red-500/10"
                    : "border-orange-400/30 bg-orange-500/10"
                }`}>
                <span className="text-lg">{f.icon}</span>
                <span className="flex-1 text-sm">{f.text}</span>
                <span className="text-gold shrink-0">←</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Funnel (#41) */}
      <section className="glass p-5">
        <h2 className="font-semibold mb-1">📊 משפך המרה</h2>
        <p className="text-smoke text-sm mb-4">30 הימים האחרונים</p>
        <div className="space-y-3">
          {funnel.map((s, i) => (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{s.label}</span>
                <span className="tabular-nums">
                  <span className="text-gold">{s.count.toLocaleString("he-IL")}</span>
                  {i > 0 && s.drop > 0 && (
                    <span className="text-red-400 text-xs mr-2">−{s.drop}%</span>
                  )}
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gold transition-all duration-700"
                  style={{ width: `${Math.max(2, s.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
        {funnel.length > 0 && funnel[0].count > 0 && (
          <p className="text-smoke text-xs mt-4">
            שיעור המרה כולל:{" "}
            <span className="text-gold">
              {Math.round((funnel[funnel.length - 1].count / funnel[0].count) * 1000) / 10}%
            </span>
          </p>
        )}
      </section>

      {/* Product performance (#43) */}
      <section className="glass p-5">
        <h2 className="font-semibold mb-4">📦 ביצועי מוצרים</h2>
        {perf.length === 0 ? (
          <p className="text-smoke text-sm">אין נתונים עדיין</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-smoke text-xs border-b border-white/10">
                  <th className="text-right pb-2">מוצר</th>
                  <th className="pb-2">צפיות</th>
                  <th className="pb-2">נמכרו</th>
                  <th className="pb-2">המרה</th>
                  <th className="pb-2 text-left">הכנסה</th>
                  <th className="pb-2 text-left">רווח</th>
                </tr>
              </thead>
              <tbody>
                {perf.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 truncate max-w-[160px]">{p.name}</td>
                    <td className="text-center tabular-nums">{p.views}</td>
                    <td className="text-center tabular-nums">{p.orders}</td>
                    <td className={`text-center tabular-nums ${
                      p.views >= 5 && p.orders === 0 ? "text-red-400" : "text-smoke"
                    }`}>
                      {p.conv}%
                    </td>
                    <td className="text-left text-gold tabular-nums">{formatPrice(p.revenue)}</td>
                    <td className={`text-left tabular-nums ${
                      p.profit > 0 ? "text-emerald-400" : "text-smoke"
                    }`}>
                      {p.cost > 0 ? formatPrice(p.profit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
