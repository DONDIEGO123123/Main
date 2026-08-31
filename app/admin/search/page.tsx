"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = { query: string; count: number; results: number };

/** Search intelligence (#57) — especially what people search and don't find. */
export default function AdminSearch() {
  const [popular, setPopular] = useState<Row[]>([]);
  const [missing, setMissing] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().from("search_log").select("query,results").limit(5000)
      .then(({ data }) => {
        const rows = (data ?? []) as { query: string; results: number }[];
        const agg = new Map<string, Row>();
        rows.forEach((r) => {
          const key = r.query.toLowerCase();
          const cur = agg.get(key) ?? { query: r.query, count: 0, results: r.results };
          cur.count += 1;
          cur.results = Math.max(cur.results, r.results);
          agg.set(key, cur);
        });
        const all = [...agg.values()].sort((a, b) => b.count - a.count);
        setPopular(all.slice(0, 15));
        setMissing(all.filter((r) => r.results === 0).slice(0, 15));
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const List = ({ title, rows, empty, warn }: { title: string; rows: Row[]; empty: string; warn?: boolean }) => (
    <div className="glass p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-smoke text-sm">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.query} className="flex items-center gap-3 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
              <span className="flex-1 truncate">{r.query}</span>
              {warn && <span className="text-red-400 text-xs shrink-0">0 תוצאות</span>}
              <span className="text-gold tabular-nums shrink-0">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">מה מחפשים באתר</h1>
      <p className="text-smoke text-sm">
        חיפושים ללא תוצאות הם רמז ישיר למה שחסר בקטלוג.
      </p>
      <div className="grid lg:grid-cols-2 gap-4">
        <List title="🔍 החיפושים הנפוצים" rows={popular} empty="אין נתונים עדיין" />
        <List title="⚠️ חיפשו ולא מצאו" rows={missing} empty="כל החיפושים מצאו תוצאות" warn />
      </div>
    </div>
  );
}
