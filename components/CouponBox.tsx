"use client";
import { useState } from "react";
import { validateCoupon, type Coupon } from "@/lib/coupon";
import { formatPrice } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export default function CouponBox({
  subtotal, memberLevel, onApply,
}: {
  subtotal: number;
  memberLevel?: string;
  onApply: (c: Coupon | null, discount: number) => void;
}) {
  const { t } = useLang();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    setBusy(true);
    const r = await validateCoupon(code, subtotal, memberLevel);
    setBusy(false);
    if (r.ok) {
      setOk(true);
      setMsg(`✅ הקופון הופעל — הנחה ${formatPrice(r.discount)}`);
      onApply(r.coupon, r.discount);
    } else {
      setOk(false);
      setMsg(r.reason);
      onApply(null, 0);
    }
  };

  const clear = () => { setCode(""); setMsg(""); setOk(false); onApply(null, 0); };

  return (
    <div className="space-y-2">
      <label className="text-sm text-smoke block">{t("couponCode")}</label>
      <div className="flex gap-2">
        <input className="input flex-1" dir="ltr" placeholder="CODE" value={code} disabled={ok}
          onChange={(e) => setCode(e.target.value.toUpperCase())} />
        {ok ? (
          <button onClick={clear} className="btn-ghost px-4 text-sm">{t("remove")}</button>
        ) : (
          <button onClick={apply} disabled={busy || !code} className="btn-gold px-5 text-sm disabled:opacity-40">
            {busy ? "…" : t("apply")}
          </button>
        )}
      </div>
      {msg && <p className={`text-xs ${ok ? "text-gold" : "text-red-400"}`}>{msg}</p>}
    </div>
  );
}
