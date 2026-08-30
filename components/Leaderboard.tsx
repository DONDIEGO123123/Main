"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";

type Row = { id: string; display_name: string; points: number; level: string };

/** Top point earners. Names only — no phone numbers or personal data. */
export default function Leaderboard() {
  const { member } = useMember();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    createClient().from("members").select("id,display_name,points,level")
      .order("points", { ascending: false }).limit(10)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  if (rows.length < 3) return null;

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);

  return (
    <section className="glass p-6">
      <h2 className="font-semibold mb-4">🏆 מובילי הקהילה</h2>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
              r.id === member?.id ? "glass-gold" : ""
            }`}>
            <span className="w-7 text-center shrink-0">{medal(i)}</span>
            <span className="flex-1 truncate text-sm">
              {r.display_name}
              {r.id === member?.id && <span className="text-gold text-xs mr-2">· אתה</span>}
            </span>
            <span className="text-gold text-sm tabular-nums shrink-0">{r.points}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
