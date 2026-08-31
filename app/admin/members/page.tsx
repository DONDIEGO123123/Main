"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type M = {
  id: string; phone: string; display_name: string; points: number;
  level: string; referral_code: string; referred_by: string | null;
  created_at: string; last_seen_at: string | null;
};
type Ev = { id: number; kind: string; label: string; points_delta: number; created_at: string };

export default function AdminMembers() {
  const [members, setMembers] = useState<M[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    createClient().from("members").select("*").order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => { setMembers((data as M[]) ?? []); setLoading(false); });
  }, []);

  const open = async (id: string) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    setEvents([]);
    const { data } = await createClient().from("member_events").select("*")
      .eq("member_id", id).order("created_at", { ascending: false }).limit(30);
    setEvents((data as Ev[]) ?? []);
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const totalPoints = members.reduce((n, m) => n + m.points, 0);
  const vips = members.filter((m) => m.level !== "member").length;
  const week = Date.now() - 7 * 864e5;
  const fresh = members.filter((m) => new Date(m.created_at).getTime() > week).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">חברי הקהילה</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { v: members.length, l: "סה״כ חברים" },
          { v: fresh, l: "הצטרפו השבוע" },
          { v: vips, l: "חברי VIP" },
          { v: totalPoints.toLocaleString("he-IL"), l: "נקודות שחולקו" },
        ].map((s) => (
          <div key={s.l} className="glass p-5 text-center">
            <p className="font-display text-2xl font-black text-gold tabular-nums">{s.v}</p>
            <p className="text-smoke text-sm mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {members.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">עדיין אין חברים רשומים</div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="glass overflow-hidden">
              <button onClick={() => open(m.id)} className="w-full p-4 flex items-center gap-3 text-right">
                <span className="px-3 py-1 rounded-full text-xs border border-gold/40 bg-gold/15 text-gold shrink-0">
                  {m.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{m.display_name}</p>
                  <p className="text-smoke text-xs mt-0.5" dir="ltr">{m.phone}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-gold font-bold tabular-nums">{m.points}</p>
                  <p className="text-smoke text-xs">נקודות</p>
                </div>
              </button>

              {openId === m.id && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <p><span className="text-smoke">קוד הפניה: </span>
                      <span className="text-gold font-mono" dir="ltr">{m.referral_code}</span></p>
                    <p><span className="text-smoke">הצטרף: </span>
                      {new Date(m.created_at).toLocaleDateString("he-IL")}</p>
                    {m.referred_by && (
                      <p className="sm:col-span-2"><span className="text-smoke">הופנה על ידי: </span>
                        <span className="text-gold font-mono" dir="ltr">{m.referred_by}</span></p>
                    )}
                    <p className="sm:col-span-2 flex gap-2">
                      <a href={`/admin/customers/${m.id}`} className="btn-gold inline-block px-4 py-2 text-sm mt-1">
                        תיק לקוח מלא
                      </a>
                      <a href={`https://wa.me/${m.phone.replace(/\D/g, "").replace(/^0/, "972")}`}
                        target="_blank" rel="noopener noreferrer" className="btn-ghost inline-block px-4 py-2 text-sm mt-1">
                        וואטסאפ לחבר
                      </a>
                    </p>
                  </div>

                  <div>
                    <p className="text-smoke text-sm mb-2">ציר פעילות</p>
                    {events.length === 0 ? (
                      <p className="text-smoke text-xs">אין פעילות</p>
                    ) : (
                      <div className="space-y-1.5">
                        {events.map((e) => (
                          <div key={e.id} className="flex items-center gap-3 text-sm">
                            <span className="text-smoke text-xs tabular-nums shrink-0">
                              {new Date(e.created_at).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="flex-1 truncate">{e.label}</span>
                            {e.points_delta !== 0 && (
                              <span className="text-gold text-xs font-semibold shrink-0">+{e.points_delta}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
