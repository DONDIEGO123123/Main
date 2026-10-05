"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMember } from "@/lib/member";
import {
  pushState, subscribeToPush, isSubscribed, type PushState,
} from "@/lib/push";
import { claimSlot, releaseSlot, onSlotFree } from "@/lib/prompt-slot";

const DISMISS_KEY = "luxe-push-dismissed";
const DELAY_MS = 25_000;   // let someone actually look around first

/**
 * Asks to send notifications — once, and only after the visitor has
 * spent a little time on the site. An immediate prompt gets denied, and
 * a denial is permanent: only the person can undo it in browser settings.
 */
export default function PushPrompt() {
  const { member } = useMember();
  const [show, setShow] = useState(false);
  const [state, setState] = useState<PushState>("unsupported");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const s = pushState();
      if (s === "denied" || s === "unsupported") return;
      if (await isSubscribed()) return;

      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
      } catch { return; }

      const reveal = () => {
        if (cancelled || !claimSlot("push")) return false;
        setState(s);
        setShow(true);
        return true;
      };

      // if the install bar is still up, wait for it to clear
      const t = setTimeout(() => {
        if (!reveal()) {
          const off = onSlotFree(() => { if (reveal()) off(); });
        }
      }, DELAY_MS);

      return () => clearTimeout(t);
    })();

    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
    releaseSlot("push");
  };

  const accept = async () => {
    setBusy(true);
    const ok = await subscribeToPush(member?.id);
    setBusy(false);
    if (ok) {
      setDone(true);
      setTimeout(() => setShow(false), 2200);
    } else {
      dismiss();
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-24 inset-x-4 z-[90] max-w-sm mx-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="glass-raised p-5">
          {done ? (
            <div className="text-center py-2">
              <p className="text-3xl mb-2" aria-hidden>✓</p>
              <p className="font-semibold text-sm">נרשמת בהצלחה</p>
              <p className="text-smoke text-xs mt-1">נעדכן אותך כשמגיע משהו חדש</p>
            </div>
          ) : state === "ios-install" ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0" aria-hidden>📲</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">רוצה לדעת ראשון על מוצרים חדשים?</p>
                  <p className="text-smoke text-xs mt-1.5 leading-relaxed">
                    הוסיפו את האתר למסך הבית: לחצו על כפתור השיתוף למטה,
                    ואז &laquo;הוספה למסך הבית&raquo;.
                  </p>
                </div>
              </div>
              <button onClick={dismiss} className="btn-ghost w-full mt-4 py-2.5 text-sm">
                הבנתי
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0" aria-hidden>🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">לקבל עדכון על מוצרים חדשים?</p>
                  <p className="text-smoke text-xs mt-1.5 leading-relaxed">
                    נשלח רק כשבאמת מגיע משהו חדש. אפשר לבטל בכל רגע.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={dismiss} className="btn-ghost flex-1 py-2.5 text-sm">
                  לא תודה
                </button>
                <button onClick={accept} disabled={busy}
                  className="btn-gold flex-1 py-2.5 text-sm disabled:opacity-50">
                  {busy ? "…" : "כן, עדכנו אותי"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
