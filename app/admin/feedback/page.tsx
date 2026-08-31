"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/notifications";

type Idea = {
  id: string; title: string; body: string; phone: string | null;
  status: string; votes: number; created_at: string;
};

const STATUSES = [
  { key: "new",       label: "חדש",     cls: "bg-gold/20 text-gold border-gold/40" },
  { key: "reviewing", label: "בבדיקה",  cls: "bg-blue-500/20 text-blue-300 border-blue-400/40" },
  { key: "planned",   label: "מתוכנן",  cls: "bg-purple-500/20 text-purple-300 border-purple-400/40" },
  { key: "completed", label: "בוצע",    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
  { key: "rejected",  label: "נדחה",    cls: "bg-red-500/20 text-red-300 border-red-400/40" },
];

export default function AdminFeedback() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().from("feedback").select("*")
      .order("votes", { ascending: false }).order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { setIdeas((data as Idea[]) ?? []); setLoading(false); });
  }, []);

  const setStatus = async (id: string, status: string) => {
    setIdeas((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    await createClient().from("feedback").update({ status }).eq("id", id);
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">רעיונות מהקהילה</h1>
      <p className="text-smoke text-sm">מסודר לפי מספר ההצבעות — מה שהכי מבוקש למעלה.</p>

      {ideas.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">אין רעיונות עדיין</div>
      ) : (
        <div className="space-y-3">
          {ideas.map((i) => {
            const st = STATUSES.find((s) => s.key === i.status) ?? STATUSES[0];
            return (
              <div key={i.id} className="glass p-4">
                <div className="flex items-start gap-3">
                  <div className="text-center shrink-0">
                    <p className="font-display text-lg font-black text-gold tabular-nums">{i.votes}</p>
                    <p className="text-smoke text-[10px]">הצבעות</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{i.title}</p>
                    {i.body && <p className="text-smoke text-sm mt-1">{i.body}</p>}
                    <p className="text-smoke text-xs mt-1">{timeAgo(i.created_at)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {STATUSES.map((s) => (
                    <button key={s.key} onClick={() => setStatus(i.id, s.key)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        i.status === s.key ? s.cls : "border-white/15 text-smoke hover:border-gold/40"
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
