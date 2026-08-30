"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/notifications";
import { waLink } from "@/lib/status-msg";

type Ticket = {
  id: string; ticket_number: number; phone: string; name: string;
  subject: string; message: string; status: string; created_at: string;
};

const STATUSES = [
  { key: "new",         label: "חדשה",   cls: "bg-gold/20 text-gold border-gold/40" },
  { key: "open",        label: "נפתחה",  cls: "bg-blue-500/20 text-blue-300 border-blue-400/40" },
  { key: "in_progress", label: "בטיפול", cls: "bg-purple-500/20 text-purple-300 border-purple-400/40" },
  { key: "resolved",    label: "נסגרה",  cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
];

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    createClient().from("support_tickets").select("*")
      .order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { setTickets((data as Ticket[]) ?? []); setLoading(false); });
  }, []);

  const setStatus = async (id: string, status: string) => {
    setTickets((t) => t.map((x) => (x.id === id ? { ...x, status } : x)));
    await createClient().from("support_tickets")
      .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  };

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  const shown = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">פניות תמיכה</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 text-center">
          <p className="font-display text-2xl font-black text-gold tabular-nums">{tickets.length}</p>
          <p className="text-smoke text-sm mt-1">סה״כ פניות</p>
        </div>
        <div className="glass-gold p-5 text-center">
          <p className="font-display text-2xl font-black gold-text tabular-nums">{openCount}</p>
          <p className="text-smoke text-sm mt-1">ממתינות לטיפול</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ key: "all", label: "הכל" }, ...STATUSES].map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition ${
              filter === s.key ? "bg-gold text-ink border-gold font-semibold" : "border-white/15 text-smoke"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">אין פניות להצגה</div>
      ) : (
        <div className="space-y-3">
          {shown.map((t) => {
            const st = STATUSES.find((s) => s.key === t.status) ?? STATUSES[0];
            const open = openId === t.id;
            return (
              <div key={t.id} className="glass overflow-hidden">
                <button onClick={() => setOpenId(open ? null : t.id)}
                  className="w-full p-4 flex items-center gap-3 text-right">
                  <span className={`px-3 py-1 rounded-full text-xs border shrink-0 ${st.cls}`}>{st.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">#{t.ticket_number} · {t.subject}</p>
                    <p className="text-smoke text-xs mt-0.5">
                      {t.name || "—"} · {timeAgo(t.created_at)}
                    </p>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <p className="text-sm whitespace-pre-line">{t.message}</p>
                    <p className="text-smoke text-sm" dir="ltr">{t.phone}</p>

                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button key={s.key} onClick={() => setStatus(t.id, s.key)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition ${
                            t.status === s.key ? s.cls : "border-white/15 text-smoke hover:border-gold/40"
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <a href={waLink(t.phone, `היי ${t.name || ""}! בנוגע לפנייה #${t.ticket_number}:`)}
                      target="_blank" rel="noopener noreferrer" className="btn-gold inline-block px-5 py-2 text-sm">
                      מענה בוואטסאפ
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
