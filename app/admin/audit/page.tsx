"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Log = {
  id: number; actor: string; action: string; entity: string;
  entity_id: string | null; summary: string; created_at: string;
};
type Trash = {
  id: number; entity: string; entity_id: string;
  deleted_by: string; deleted_at: string;
  payload: Record<string, unknown>;
};

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  create:  { label: "יצירה",  icon: "➕" },
  update:  { label: "עדכון",  icon: "✏️" },
  delete:  { label: "מחיקה",  icon: "🗑️" },
  restore: { label: "שחזור",  icon: "↩️" },
  login:   { label: "כניסה",  icon: "🔑" },
};

/** Audit log (#46) and recycle bin (#47). */
export default function AdminAudit() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [trash, setTrash] = useState<Trash[]>([]);
  const [tab, setTab] = useState<"log" | "trash">("log");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const s = createClient();
    const [lQ, tQ] = await Promise.all([
      s.from("admin_log").select("*").order("created_at", { ascending: false }).limit(200),
      s.from("trash").select("*").order("deleted_at", { ascending: false }).limit(100),
    ]);
    setLogs((lQ.data as Log[]) ?? []);
    setTrash((tQ.data as Trash[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const restore = async (id: number) => {
    await createClient().rpc("restore_trash", { p_trash_id: id, p_actor: "admin" });
    load();
  };

  const purge = async (id: number) => {
    if (!confirm("למחוק לצמיתות? לא ניתן לשחזר.")) return;
    await createClient().from("trash").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">יומן וסל מיחזור</h1>

      <div className="flex gap-2">
        {([["log", `יומן פעולות (${logs.length})`], ["trash", `סל מיחזור (${trash.length})`]] as const)
          .map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2.5 rounded-xl text-sm border transition ${
                tab === k ? "bg-gold text-ink border-gold font-semibold" : "border-white/15 text-smoke"
              }`}>
              {label}
            </button>
          ))}
      </div>

      {tab === "log" ? (
        logs.length === 0 ? (
          <div className="glass p-12 text-center text-smoke">אין פעולות מתועדות עדיין</div>
        ) : (
          <div className="glass divide-y divide-white/5">
            {logs.map((l) => {
              const a = ACTION_LABELS[l.action] ?? { label: l.action, icon: "•" };
              return (
                <div key={l.id} className="p-3 flex items-center gap-3 text-sm">
                  <span className="shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      {a.label} · <span className="text-smoke">{l.entity}</span>
                      {l.summary && ` — ${l.summary}`}
                    </p>
                    <p className="text-smoke text-[11px] mt-0.5">
                      {l.actor || "admin"} · {timeAgo(l.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : trash.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">סל המיחזור ריק</div>
      ) : (
        <div className="space-y-2">
          {trash.map((t) => (
            <div key={t.id} className="glass p-4 flex items-center gap-3">
              <span className="text-lg shrink-0">🗑️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {(t.payload.name as string) || (t.payload.title as string) || t.entity_id}
                </p>
                <p className="text-smoke text-xs mt-0.5">
                  {t.entity} · נמחק {timeAgo(t.deleted_at)}
                </p>
              </div>
              <button onClick={() => restore(t.id)} className="btn-gold px-4 py-2 text-sm shrink-0">
                שחזור
              </button>
              <button onClick={() => purge(t.id)} className="text-red-400 text-xs shrink-0">
                מחק לצמיתות
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
