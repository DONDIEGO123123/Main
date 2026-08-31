"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/notifications";

type Row = {
  id: number; table_name: string; record_id: string;
  payload: Record<string, unknown>; deleted_at: string; restored_at: string | null;
};

const TABLE_LABELS: Record<string, string> = {
  products: "מוצר",
  orders: "הזמנה",
  categories: "קטגוריה",
};

/** Recycle bin (#47) — nothing important is gone for good. */
export default function AdminTrash() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    createClient().from("trash").select("*")
      .is("restored_at", null).order("deleted_at", { ascending: false }).limit(200)
      .then(({ data }) => { setRows((data as Row[]) ?? []); setLoading(false); });
  };

  useEffect(load, []);

  const restore = async (id: number) => {
    setBusy(id);
    await createClient().rpc("restore_from_trash", { p_trash_id: id });
    setBusy(null);
    load();
  };

  const purge = async (id: number) => {
    if (!confirm("למחוק לצמיתות? פעולה זו אינה הפיכה.")) return;
    await createClient().from("trash").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const nameOf = (r: Row) =>
    (r.payload.name as string) || (r.payload.order_number ? `#${r.payload.order_number}` : r.record_id.slice(0, 8));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">סל מיחזור</h1>
      <p className="text-smoke text-sm">
        מוצרים, הזמנות וקטגוריות שנמחקו נשמרים כאן וניתנים לשחזור.
      </p>

      {rows.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">הסל ריק</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="glass p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{nameOf(r)}</p>
                <p className="text-smoke text-xs mt-0.5">
                  {TABLE_LABELS[r.table_name] ?? r.table_name} · נמחק {timeAgo(r.deleted_at)}
                </p>
              </div>
              <button onClick={() => restore(r.id)} disabled={busy === r.id}
                className="btn-gold px-4 py-2 text-sm shrink-0 disabled:opacity-50">
                {busy === r.id ? "…" : "שחזור"}
              </button>
              <button onClick={() => purge(r.id)} className="text-red-400 text-sm shrink-0">
                מחיקה
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
