"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import { claimDaily, claimedToday, type DailyResult } from "@/lib/wallet";
import { useFlag } from "@/lib/flags";

type Day = { day_index: number; label: string; points: number; icon: string };

/** Daily reward (#13). One claim per calendar day, enforced by the database. */
export default function DailyReward() {
  const { member, refresh } = useMember();
  const enabled = useFlag("daily_reward");
  const [days, setDays] = useState<Day[]>([]);
  const [claimed, setClaimed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DailyResult | null>(null);

  useEffect(() => {
    if (!member) return;
    createClient().from("daily_rewards").select("*").order("day_index")
      .then(({ data }) => setDays((data as Day[]) ?? []));
    claimedToday(member.id).then((c) => setClaimed(c));
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled || !member || days.length === 0) return null;

  const streak = member.streak_days ?? 1;
  const todayIndex = ((Math.max(streak, 1) - 1) % 7) + 1;

  const claim = async () => {
    setBusy(true);
    const r = await claimDaily(member.id);
    setBusy(false);
    if (r.ok) {
      setResult(r);
      setClaimed(true);
      await refresh();
      setTimeout(() => setResult(null), 5000);
    } else if (r.reason === "claimed") {
      setClaimed(true);
    }
  };

  return (
    <section className="glass p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-semibold flex-1">🎡 תגמול יומי</h2>
        {claimed && <span className="text-smoke text-xs">נוצל היום ✓</span>}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {days.map((d) => {
          const passed = d.day_index < todayIndex;
          const isToday = d.day_index === todayIndex;
          return (
            <div key={d.day_index}
              className={`rounded-lg py-2 text-center border transition ${
                isToday ? "border-gold bg-gold/15"
                : passed ? "border-white/10 opacity-45"
                : "border-white/10 opacity-70"
              }`}>
              <p className="text-base leading-none">{passed ? "✓" : d.icon}</p>
              <p className="text-[10px] text-gold mt-1 tabular-nums">{d.points}</p>
            </div>
          );
        })}
      </div>

      {result?.ok ? (
        <div className="glass-gold p-4 text-center">
          <p className="text-2xl">{result.icon}</p>
          <p className="font-semibold text-sm mt-1">{result.label}</p>
          <p className="text-gold text-sm">+{result.points} נקודות</p>
        </div>
      ) : (
        <button onClick={claim} disabled={claimed || busy}
          className="btn-gold w-full py-3 disabled:opacity-40">
          {busy ? "…" : claimed ? "חזרו מחר 🌙" : "קבלת התגמול היומי ←"}
        </button>
      )}
    </section>
  );
}
