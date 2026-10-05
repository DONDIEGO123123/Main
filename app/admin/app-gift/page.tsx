"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { timeAgo } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Claim = {
  id: string; phone: string; code: string;
  amount: number; created_at: string;
};
type Coupon = { code: string; used_count: number };

/** Who claimed the install gift, and what it has actually cost. */
export default function AdminAppGift() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const s = createClient();
    const [c, st] = await Promise.all([
      s.from("app_gift_claims").select("*")
        .order("created_at", { ascending: false }).limit(300),
      s.from("settings").select("value").eq("key", "site").maybeSingle(),
    ]);

    const rows = (c.data as Claim[]) ?? [];
    setClaims(rows);
    setEnabled(
      ((st.data?.value ?? {}) as { app_gift_enabled?: boolean }).app_gift_enabled !== false
    );

    // which vouchers were actually redeemed — that's the real cost
    if (rows.length) {
      const { data: cps } = await s.from("coupons")
        .select("code,used_count").in("code", rows.map((r) => r.code));
      setUsed(new Set(
        ((cps ?? []) as Coupon[]).filter((x) => x.used_count > 0).map((x) => x.code)
      ));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    const s = createClient();
    const { data } = await s.from("settings").select("value").eq("key", "site").maybeSingle();
    await s.from("settings")
      .update({ value: { ...(data?.value ?? {}), app_gift_enabled: next } })
      .eq("key", "site");
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const issued = claims.reduce((n, c) => n + Number(c.amount), 0);
  const redeemed = claims
    .filter((c) => used.has(c.code))
    .reduce((n, c) => n + Number(c.amount), 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">מתנת התקנה</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 text-center">
          <p className="font-display text-xl font-black text-gold tabular-nums">
            {claims.length}
          </p>
          <p className="text-smoke text-xs mt-1">שוברים שהונפקו</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="font-display text-xl font-black text-gold tabular-nums">
            {formatPrice(issued)}
          </p>
          <p className="text-smoke text-xs mt-1">סך ההתחייבות</p>
        </div>
        <div className="glass-gold p-4 text-center">
          <p className="font-display text-xl font-black gold-text tabular-nums">
            {formatPrice(redeemed)}
          </p>
          <p className="text-smoke text-xs mt-1">נוצל בפועל</p>
        </div>
      </div>

      <button onClick={toggle}
        className="w-full glass p-4 flex items-center gap-3 text-right">
        <div className="flex-1">
          <p className="font-semibold text-sm">המבצע פעיל</p>
          <p className="text-smoke text-xs mt-0.5">
            כיבוי מפסיק להציע את המתנה ללקוחות חדשים
          </p>
        </div>
        <span className={`w-11 h-6 rounded-full transition relative shrink-0 ${
          enabled ? "bg-gold" : "bg-white/15"
        }`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-ink transition-all ${
            enabled ? "right-1" : "right-6"
          }`} />
        </span>
      </button>

      {claims.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">
          עוד לא נוצלה מתנה
        </div>
      ) : (
        <div className="space-y-2">
          {claims.map((c) => (
            <div key={c.id} className="glass p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" dir="ltr">{c.phone}</p>
                <p className="text-smoke text-xs mt-0.5">{timeAgo(c.created_at)}</p>
              </div>
              <span className="font-mono text-gold text-sm shrink-0" dir="ltr">
                {c.code}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${
                used.has(c.code)
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/40"
                  : "border-white/15 text-smoke"
              }`}>
                {used.has(c.code) ? "נוצל" : "ממתין"}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-smoke text-xs leading-relaxed">
        כל מספר טלפון מקבל שובר אחד בלבד, והבדיקה נעשית בשרת — גלישה
        בסתר או מחיקת נתונים לא מנפיקות שובר נוסף. הסכום ומינימום
        ההזמנה נערכים בהגדרות האתר.
      </p>
    </div>
  );
}
