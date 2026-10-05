"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import { useSiteSettings } from "@/lib/site";
import { useInstall } from "@/lib/install";
import { subscribeToPush, pushState, isSubscribed } from "@/lib/push";
import { claimSlot, releaseSlot, onSlotFree } from "@/lib/prompt-slot";

const DISMISS_KEY = "luxe-gift-dismissed";
const CODE_KEY = "luxe-gift-code";
const DELAY_MS = 12_000;

type Step = "offer" | "ios" | "phone" | "done";

/**
 * Offers a fixed-amount coupon for installing the app and turning on
 * notifications.
 *
 * The coupon is issued by a server function keyed to the phone number, so
 * clearing storage or using a private window cannot earn a second one.
 */
export default function AppGift() {
  const { member } = useMember();
  const site = useSiteSettings() as {
    app_gift_enabled?: boolean;
    app_gift_amount?: number;
    app_gift_min?: number;
  };
  const { mode, install } = useInstall();

  const [show, setShow] = useState(false);
  const [step, setStep] = useState<Step>("offer");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = site.app_gift_amount ?? 50;
  const minOrder = site.app_gift_min ?? 200;

  useEffect(() => {
    if (site.app_gift_enabled === false) return;

    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
        const saved = localStorage.getItem(CODE_KEY);
        if (saved) return;              // already claimed on this device
      } catch { return; }

      if (pushState() === "denied") return;
      if (await isSubscribed() && mode === "installed") return;

      const reveal = () => {
        if (cancelled || !claimSlot("gift")) return false;
        setShow(true);
        return true;
      };

      const t = setTimeout(() => {
        if (!reveal()) {
          const off = onSlotFree(() => { if (reveal()) off(); });
        }
      }, DELAY_MS);
      return () => clearTimeout(t);
    })();

    return () => { cancelled = true; };
  }, [site.app_gift_enabled, mode]);

  useEffect(() => {
    if (member?.phone && !phone) setPhone(member.phone);
  }, [member?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
    releaseSlot("gift");
  };

  /** Install (or explain how on iOS), then ask permission, then collect a phone. */
  const start = async () => {
    setErr("");
    setBusy(true);

    if (mode === "ios") { setBusy(false); setStep("ios"); return; }
    if (mode === "android") await install();

    const ok = await subscribeToPush(member?.id);
    setBusy(false);

    if (!ok) {
      setErr("צריך לאשר את ההתראות כדי לקבל את המתנה");
      return;
    }
    setStep("phone");
  };

  /** The server decides whether this phone has already had its gift. */
  const claim = async () => {
    setErr("");
    if (phone.replace(/\D/g, "").length < 9) {
      setErr("נא להזין מספר טלפון תקין");
      return;
    }
    setBusy(true);

    let endpoint: string | null = null;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      endpoint = sub?.endpoint ?? null;
    } catch { /* no subscription object available */ }

    const { data, error } = await createClient().rpc("claim_app_gift", {
      p_phone: phone.trim(),
      p_endpoint: endpoint,
    });
    setBusy(false);

    const res = data as {
      ok: boolean; code?: string; reason?: string; repeat?: boolean;
    } | null;

    if (error || !res?.ok) {
      const reasons: Record<string, string> = {
        bad_phone: "מספר הטלפון אינו תקין",
        device_used: "המכשיר הזה כבר קיבל מתנה",
        not_subscribed: "צריך לאשר התראות כדי לקבל את המתנה",
        disabled: "המבצע אינו פעיל כרגע",
      };
      setErr(reasons[res?.reason ?? ""] ?? "לא הצלחנו להנפיק את הקוד, נסו שוב");
      return;
    }

    setCode(res.code!);
    try { localStorage.setItem(CODE_KEY, res.code!); } catch { /* ignore */ }
    setStep("done");
  };

  if (!show) return null;

  const money = `₪${amount}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[96] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={step === "done" ? dismiss : undefined}
      >
        <motion.div
          className="glass-raised p-6 w-full max-w-sm relative"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={dismiss} aria-label="סגירה"
            className="absolute top-3 left-3 text-smoke text-xl leading-none">×</button>

          {step === "offer" && (
            <>
              <p className="text-4xl text-center mb-3" aria-hidden>🎁</p>
              <h2 className="font-display text-2xl font-bold text-center">
                {money} מתנה
              </h2>
              <p className="text-smoke text-sm text-center mt-3 leading-relaxed">
                התקינו את האפליקציה ואשרו התראות, וקבלו שובר של {money}
                {minOrder > 0 && ` לקנייה מעל ₪${minOrder}`}.
              </p>

              <div className="mt-5 space-y-2.5">
                {[
                  ["📱", "התקנה במסך הבית"],
                  ["🔔", "אישור התראות"],
                  ["🎁", `שובר ${money} מיד`],
                ].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className="shrink-0" aria-hidden>{icon}</span>
                    <span className="text-smoke">{label}</span>
                  </div>
                ))}
              </div>

              {err && <p className="text-red-400 text-sm mt-4 text-center">{err}</p>}

              <button onClick={start} disabled={busy}
                className="btn-gold w-full mt-6 py-3.5 disabled:opacity-50">
                {busy ? "…" : "קבלת המתנה"}
              </button>
              <button onClick={dismiss} className="w-full mt-3 text-smoke text-sm">
                לא עכשיו
              </button>
            </>
          )}

          {step === "ios" && (
            <>
              <p className="text-3xl text-center mb-3" aria-hidden>📲</p>
              <h2 className="font-display text-xl font-bold text-center">
                קודם מוסיפים למסך הבית
              </h2>
              <p className="text-smoke text-sm text-center mt-2">
                באייפון זה הכרחי כדי לקבל התראות
              </p>

              <ol className="mt-6 space-y-4">
                {[
                  ["1", "לחצו על כפתור השיתוף", "בתחתית המסך"],
                  ["2", "בחרו «הוספה למסך הבית»", "גללו מעט למצוא אותו"],
                  ["3", "פתחו את האתר מהמסך", "ותקבלו את המתנה"],
                ].map(([n, title, sub]) => (
                  <li key={n} className="flex gap-3">
                    <span className="h-7 w-7 rounded-full bg-gold text-ink grid place-items-center
                                     text-sm font-bold shrink-0">{n}</span>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-smoke text-xs mt-0.5">{sub}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <button onClick={dismiss} className="btn-ghost w-full mt-7 py-3">
                הבנתי
              </button>
            </>
          )}

          {step === "phone" && (
            <>
              <p className="text-3xl text-center mb-3" aria-hidden>✓</p>
              <h2 className="font-display text-xl font-bold text-center">
                כמעט שם
              </h2>
              <p className="text-smoke text-sm text-center mt-2">
                הזינו טלפון והשובר יונפק על שמכם
              </p>

              <input
                className="input text-center text-lg py-3.5 mt-6"
                dir="ltr" inputMode="tel" autoComplete="tel" autoFocus
                placeholder="050-0000000"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") claim(); }}
              />

              {err && <p className="text-red-400 text-sm mt-3 text-center">{err}</p>}

              <button onClick={claim} disabled={busy}
                className="btn-gold w-full mt-5 py-3.5 disabled:opacity-50">
                {busy ? "מנפיק…" : `קבלת שובר ${money}`}
              </button>
            </>
          )}

          {step === "done" && (
            <>
              <p className="text-4xl text-center mb-3" aria-hidden>🎉</p>
              <h2 className="font-display text-xl font-bold text-center">
                השובר שלכם מוכן
              </h2>

              <div className="glass-gold mt-6 p-5 text-center">
                <p className="font-mono text-2xl gold-text tracking-wider" dir="ltr">
                  {code}
                </p>
                <p className="text-smoke text-xs mt-2">
                  {money} הנחה{minOrder > 0 && ` · לקנייה מעל ₪${minOrder}`}
                </p>
              </div>

              <p className="text-smoke text-xs text-center mt-4 leading-relaxed">
                הזינו את הקוד בעמוד התשלום. שמרנו אותו גם אצלנו,
                כך שתוכלו לבקש אותו שוב בוואטסאפ.
              </p>

              <button onClick={dismiss} className="btn-gold w-full mt-6 py-3.5">
                לקטלוג
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
