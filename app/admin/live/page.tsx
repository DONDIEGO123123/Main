"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { describeEvent } from "@/lib/events";
import { timeAgo } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Ev = {
  id: number; name: string; entity_type: string | null;
  entity_id: string | null; metadata: Record<string, unknown>; created_at: string;
};

/**
 * Live activity (#42). Streams the event table in real time.
 * Shows what is happening, never who — no personal identifiers.
 */
export default function AdminLive() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [online, setOnline] = useState(0);

  useEffect(() => {
    const s = createClient();

    s.from("products").select("id,name").limit(500).then(({ data }) => {
      setNames(new Map(((data ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name])));
    });

    s.from("events").select("*").order("created_at", { ascending: false }).limit(40)
      .then(({ data }) => setEvents((data as Ev[]) ?? []));

    const channel = s.channel("live-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "events" },
        (payload) => setEvents((prev) => [payload.new as Ev, ...prev].slice(0, 40)))
      .subscribe();

    // active sessions in the last five minutes
    const tick = async () => {
      const since = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data } = await s.from("events").select("session_id").gte("created_at", since).limit(1000);
      setOnline(new Set(((data ?? []) as { session_id: string | null }[])
        .map((r) => r.session_id).filter(Boolean)).size);
    };
    tick();
    const timer = setInterval(tick, 20_000);

    return () => { s.removeChannel(channel); clearInterval(timer); };
  }, []);

  const label = (e: Ev) => {
    const base = describeEvent(e.name, e.metadata);
    if (e.entity_type === "product" && e.entity_id) {
      const n = names.get(e.entity_id);
      if (n) return `${base}: ${n}`;
    }
    return base;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">פעילות חיה</h1>

      <div className="glass-gold p-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="font-display text-3xl font-black gold-text tabular-nums">{online}</p>
        </div>
        <p className="text-smoke text-sm mt-1">פעילים ב-5 הדקות האחרונות</p>
      </div>

      <section className="glass p-5">
        <h2 className="font-semibold mb-4">⚡ מה קורה עכשיו</h2>
        {events.length === 0 ? (
          <p className="text-smoke text-sm">אין פעילות עדיין</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                <span className="flex-1 truncate">{label(e)}</span>
                <span className="text-smoke text-xs shrink-0">{timeAgo(e.created_at)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-smoke text-xs mt-4">
          מוצג מה קורה באתר, ללא פרטים מזהים של מבקרים.
        </p>
      </section>
    </div>
  );
}
