"use client";
import { useState } from "react";
import { useMember } from "@/lib/member";
import { openMystery, type MysteryResult } from "@/lib/wallet";
import { useFlag } from "@/lib/flags";

/**
 * Mystery reward (#12). The prize is drawn server-side from a weighted
 * table, and each trigger can only ever be opened once.
 */
export default function MysteryBox({
  trigger, title = "יש לך הפתעה", subtitle = "לחצו לפתיחה",
}: { trigger: string; title?: string; subtitle?: string }) {
  const enabled = useFlag("mystery");
  const { member, refresh } = useMember();
  const [result, setResult] = useState<MysteryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);


  if (!enabled) return null;

  if (!member || hidden) return null;

  const open = async () => {
    setBusy(true);
    const r = await openMystery(member.id, trigger);
    setBusy(false);
    if (r.ok) { setResult(r); await refresh(); }
    else setHidden(true);          // already opened, or nothing to give
  };

  if (result?.ok) {

  return (
      <section className="glass-gold p-6 text-center">
        <p className="text-4xl mb-2">🎉</p>
        <p className="font-semibold">{result.label}</p>
        {result.kind === "coupon" && result.code && (
          <>
            <p className="font-mono text-2xl gold-text mt-3 tracking-wider" dir="ltr">{result.code}</p>
            <p className="text-smoke text-xs mt-1">הזינו את הקוד בעמוד התשלום</p>
          </>
        )}
        {result.kind === "points" && (
          <p className="text-gold text-sm mt-2">+{result.points} נקודות</p>
        )}
      </section>
    );
  }

  return (
    <button onClick={open} disabled={busy}
      className="w-full glass-gold p-6 text-center hover:border-gold/50 transition disabled:opacity-50">
      <p className="text-4xl mb-2 animate-pulse">🎁</p>
      <p className="font-semibold">{title}</p>
      <p className="text-smoke text-sm mt-1">{busy ? "פותח…" : subtitle}</p>
    </button>
  );
}
