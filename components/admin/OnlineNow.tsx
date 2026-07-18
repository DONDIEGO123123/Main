"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Live counter of visitors currently on the site (Supabase Realtime presence). */
export default function OnlineNow() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("online-visitors");
    const update = () => setCount(Object.keys(channel.presenceState()).length);
    channel.on("presence", { event: "sync" }, update);
    channel.on("presence", { event: "join" }, update);
    channel.on("presence", { event: "leave" }, update);
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="glass-gold p-5 text-center relative overflow-hidden">
      <span className="absolute top-3 left-3 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>
      <p className="font-display text-3xl font-black gold-text tabular-nums">
        {count === null ? "–" : count.toLocaleString("he-IL")}
      </p>
      <p className="text-smoke text-sm mt-1">מחוברים עכשיו</p>
    </div>
  );
}
