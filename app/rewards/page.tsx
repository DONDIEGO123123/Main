"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";

export const dynamic = "force-dynamic";

type Reward = {
  id: string; title: string; description: string; points_cost: number;
  coupon_code: string | null; min_level: string; is_active: boolean;
};

export default function RewardsPage() {
  const router = useRouter();
  const { member, ready, refresh } = useMember();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [got, setGot] = useState<{ title: string; code: string } | null>(null);

  useEffect(() => { if (ready && !member) router.replace("/join"); }, [ready, member, router]);

  useEffect(() => {
    createClient().from("rewards").select("*").eq("is_active", true).order("points_cost")
      .then(({ data }) => setRewards((data as Reward[]) ?? []));
  }, []);

  const redeem = async (r: Reward) => {
    if (!member || member.points < r.points_cost) return;
    setBusy(r.id);
    const supabase = createClient();

    // generate a personal one-time coupon for this redemption
    const code = r.coupon_code || `RW${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (!r.coupon_code) {
      const isPercent = /(\d+)%/.exec(r.title);
      await supabase.from("coupons").insert({
        code,
        kind: isPercent ? "percent" : "amount",
        value: isPercent ? Number(isPercent[1]) : 0,
        max_uses: 1,
      });
    }

    await supabase.from("reward_redemptions").insert({
      member_id: member.id, reward_id: r.id, points_spent: r.points_cost, code,
    });
    await supabase.from("members").update({ points: member.points - r.points_cost }).eq("id", member.id);
    await supabase.from("member_events").insert({
      member_id: member.id, kind: "points", label: `מימוש: ${r.title}`, points_delta: -r.points_cost,
    });

    await refresh();
    setBusy(null);
    setGot({ title: r.title, code });
  };

  if (!ready || !member) return <div className="h-96 grid place-items-center text-smoke">טוען…</div>;

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
      <div className="glass-gold p-6 text-center">
        <p className="text-4xl mb-2">🎁</p>
        <h1 className="font-display text-2xl font-bold gold-text">מרכז ההטבות</h1>
        <p className="font-display text-4xl font-black gold-text mt-4 tabular-nums">{member.points}</p>
        <p className="text-smoke text-sm">הנקודות שלך</p>
      </div>

      {got && (
        <div className="glass-gold p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-semibold">{got.title}</p>
          <p className="text-smoke text-sm mt-1">הקוד שלך:</p>
          <p className="font-mono text-2xl gold-text mt-2 tracking-wider" dir="ltr">{got.code}</p>
          <p className="text-smoke text-xs mt-3">הזינו אותו בעמוד התשלום</p>
          <button onClick={() => setGot(null)} className="btn-ghost mt-4 px-6 py-2 text-sm">סגירה</button>
        </div>
      )}

      <div className="space-y-3">
        {rewards.length === 0 ? (
          <div className="glass p-10 text-center text-smoke">אין הטבות זמינות כרגע</div>
        ) : rewards.map((r) => {
          const can = member.points >= r.points_cost;
          return (
            <div key={r.id} className="glass p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{r.title}</p>
                {r.description && <p className="text-smoke text-sm mt-0.5">{r.description}</p>}
                <p className="text-gold text-sm mt-1 tabular-nums">{r.points_cost} נקודות</p>
              </div>
              <button onClick={() => redeem(r)} disabled={!can || busy === r.id}
                className="btn-gold px-5 py-2.5 text-sm disabled:opacity-30 shrink-0">
                {busy === r.id ? "…" : can ? "מימוש" : `חסרות ${r.points_cost - member.points}`}
              </button>
            </div>
          );
        })}
      </div>

      <Link href="/me" className="btn-ghost block text-center py-3">← לאזור האישי</Link>
    </main>
  );
}
