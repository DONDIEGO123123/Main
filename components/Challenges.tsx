"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMember, awardPoints } from "@/lib/member";
import type { Order } from "@/lib/types";

type Challenge = {
  id: string; title: string; description: string;
  goal_type: "orders" | "points" | "referrals";
  goal_value: number; reward_points: number;
};

/** Community challenges with real progress from orders, points and referrals. */
export default function Challenges() {
  const { member, refresh } = useMember();
  const [list, setList] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    if (!member) return;
    (async () => {
      const s = createClient();
      const [chQ, ordersQ, refQ, compQ] = await Promise.all([
        s.from("challenges").select("*").eq("is_active", true).order("sort_order"),
        s.from("orders").select("id,status").eq("customer_phone", member.phone).neq("status", "cancelled"),
        s.from("orders").select("id").eq("referral_code", member.referral_code).neq("status", "cancelled"),
        s.from("challenge_completions").select("challenge_id").eq("member_id", member.id),
      ]);

      const challenges = (chQ.data as Challenge[]) ?? [];
      const orderCount = ((ordersQ.data as Order[]) ?? []).length;
      const refCount = ((refQ.data ?? []) as unknown[]).length;
      const completed = ((compQ.data ?? []) as { challenge_id: string }[]).map((c) => c.challenge_id);

      const prog: Record<string, number> = {};
      challenges.forEach((c) => {
        prog[c.id] =
          c.goal_type === "orders" ? orderCount
          : c.goal_type === "referrals" ? refCount
          : member.points;
      });

      setList(challenges);
      setProgress(prog);
      setDone(completed);

      // award anything newly finished
      for (const c of challenges) {
        if (completed.includes(c.id) || prog[c.id] < c.goal_value) continue;
        const { error } = await s.from("challenge_completions")
          .insert({ member_id: member.id, challenge_id: c.id });
        if (error) continue; // already recorded
        // idempotency key means a repeated render can never double-pay
        await awardPoints(
          member.id, "challenge", `אתגר הושלם: ${c.title}`,
          c.reward_points, `challenge-${member.id}-${c.id}`
        );
        setDone((d) => [...d, c.id]);
        refresh();
      }
    })();
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member || list.length === 0) return null;

  return (
    <section className="glass p-6">
      <h2 className="font-semibold mb-4">🎯 אתגרים</h2>
      <div className="space-y-4">
        {list.map((c) => {
          const cur = Math.min(progress[c.id] ?? 0, c.goal_value);
          const pct = Math.round((cur / c.goal_value) * 100);
          const finished = done.includes(c.id);
          return (
            <div key={c.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className={finished ? "text-gold" : ""}>
                  {finished ? "✓ " : ""}{c.title}
                </span>
                <span className="text-smoke text-xs shrink-0">
                  {finished ? `+${c.reward_points}` : `${cur}/${c.goal_value}`}
                </span>
              </div>
              {c.description && <p className="text-smoke text-xs mb-1.5">{c.description}</p>}
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full transition-all duration-700 ${finished ? "bg-emerald-400" : "bg-gold"}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
