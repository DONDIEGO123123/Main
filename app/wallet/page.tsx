"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMember } from "@/lib/member";
import {
  pointsLedger, myRewards, expiringSoon, timeLeft,
  type LedgerRow, type RewardRow,
} from "@/lib/wallet";
import DailyReward from "@/components/DailyReward";

export const dynamic = "force-dynamic";

/** The wallet (#15): balance, holdings, expiries and a full ledger (#64,#65). */
export default function WalletPage() {
  const router = useRouter();
  const { member, ready } = useMember();
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [tab, setTab] = useState<"rewards" | "history">("rewards");

  useEffect(() => { if (ready && !member) router.replace("/join"); }, [ready, member, router]);

  useEffect(() => {
    if (!member) return;
    pointsLedger(member.id).then(setLedger);
    myRewards(member.id).then(setRewards);
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member) return <div className="h-96 grid place-items-center text-smoke">טוען…</div>;

  const active = rewards.filter((r) => !r.consumed_at);
  const expiring = expiringSoon(rewards);

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
      <div className="glass-gold p-6 text-center">
        <p className="text-3xl mb-1">💳</p>
        <h1 className="font-display text-xl font-bold gold-text">הארנק שלי</h1>
        <p className="font-display text-4xl font-black gold-text mt-4 tabular-nums">{member.points}</p>
        <p className="text-smoke text-sm">נקודות זמינות</p>
      </div>

      <DailyReward />

      {/* Expiring soon (#16) */}
      {expiring.length > 0 && (
        <section className="glass p-5 border-gold/40">
          <h2 className="font-semibold mb-3">⏳ עומד לפוג</h2>
          <div className="space-y-2">
            {expiring.map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate">{r.label}</span>
                {r.ref_id && <span className="font-mono text-gold text-xs" dir="ltr">{r.ref_id}</span>}
                <span className="text-red-400 text-xs shrink-0">{timeLeft(r.expires_at!)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-2">
        {([["rewards", "ההטבות שלי"], ["history", "היסטוריית נקודות"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2.5 rounded-xl text-sm border transition ${
              tab === k ? "bg-gold text-ink border-gold font-semibold" : "border-white/15 text-smoke"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "rewards" ? (
        <section className="glass p-5">
          {active.length === 0 ? (
            <p className="text-smoke text-sm text-center py-6">אין הטבות פעילות כרגע</p>
          ) : (
            <div className="space-y-3">
              {active.map((r) => (
                <div key={r.id} className="flex items-center gap-3 border-b border-white/5 last:border-0 pb-3 last:pb-0">
                  <span className="text-xl">{r.kind === "coupon" ? "🏷️" : "🎁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.label}</p>
                    <p className="text-smoke text-xs">
                      {new Date(r.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  {r.ref_id && (
                    <span className="font-mono text-gold text-sm shrink-0" dir="ltr">{r.ref_id}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link href="/rewards" className="btn-ghost block text-center py-2.5 text-sm mt-4">
            למרכז ההטבות ←
          </Link>
        </section>
      ) : (
        <section className="glass p-5">
          {ledger.length === 0 ? (
            <p className="text-smoke text-sm text-center py-6">אין תנועות עדיין</p>
          ) : (
            <div className="space-y-2">
              {ledger.map((l) => (
                <div key={l.id} className="flex items-center gap-3 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{l.reason}</p>
                    <p className="text-smoke text-[11px]">
                      {new Date(l.created_at).toLocaleDateString("he-IL", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`font-semibold tabular-nums shrink-0 ${
                    l.delta > 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {l.delta > 0 ? "+" : ""}{l.delta}
                  </span>
                  <span className="text-smoke text-xs tabular-nums w-12 text-left shrink-0">
                    {l.balance_after}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <Link href="/me" className="btn-ghost block text-center py-3">← לאזור האישי</Link>
    </main>
  );
}
