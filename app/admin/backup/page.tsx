"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TABLES = [
  { key: "products", label: "מוצרים" },
  { key: "categories", label: "קטגוריות" },
  { key: "orders", label: "הזמנות" },
  { key: "members", label: "חברי קהילה" },
  { key: "reviews", label: "ביקורות" },
  { key: "coupons", label: "קופונים" },
  { key: "settings", label: "הגדרות" },
];

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function download(name: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBackup() {
  const [busy, setBusy] = useState("");
  const stamp = () => new Date().toISOString().slice(0, 10);

  const one = async (table: string, label: string) => {
    setBusy(table);
    const { data } = await createClient().from(table).select("*");
    download(`${table}-${stamp()}.csv`, toCsv((data ?? []) as Record<string, unknown>[]));
    setBusy("");
  };

  const all = async () => {
    setBusy("all");
    const s = createClient();
    const dump: Record<string, unknown> = {};
    for (const t of TABLES) {
      const { data } = await s.from(t.key).select("*");
      dump[t.key] = data ?? [];
    }
    download(`luxe-backup-${stamp()}.json`, JSON.stringify(dump, null, 2), "application/json");
    setBusy("");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">גיבוי נתונים</h1>
      <p className="text-smoke text-sm">
        הורדת עותק של הנתונים למחשב. מומלץ אחת לשבוע — ותמיד לפני שינוי גדול.
      </p>

      <button onClick={all} disabled={busy === "all"} className="btn-gold w-full py-4 disabled:opacity-50">
        {busy === "all" ? "מכין גיבוי…" : "⬇ גיבוי מלא (JSON)"}
      </button>

      <div className="space-y-2">
        <p className="text-smoke text-sm">או הורדה נפרדת כקובץ אקסל:</p>
        {TABLES.map((t) => (
          <div key={t.key} className="glass p-4 flex items-center gap-3">
            <span className="flex-1 text-sm">{t.label}</span>
            <button onClick={() => one(t.key, t.label)} disabled={busy === t.key}
              className="btn-ghost px-4 py-2 text-sm disabled:opacity-50">
              {busy === t.key ? "…" : "CSV"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
