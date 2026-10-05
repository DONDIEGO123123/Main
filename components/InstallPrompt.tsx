"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInstall } from "@/lib/install";
import { useSiteSettings } from "@/lib/site";
import { claimSlot, releaseSlot } from "@/lib/prompt-slot";

const DISMISS_KEY = "luxe-install-dismissed";

/**
 * Offers to install the site as an app.
 *
 * The old version relied on `beforeinstallprompt`, which iOS never fires —
 * so iPhone users were never offered anything. iOS now gets the manual
 * Share → Add to Home Screen instructions instead, which matters because
 * push notifications on iOS only work once the site is installed.
 */

/** The gift offer covers install and notifications, so it goes first. */
function giftPending(): boolean {
  try {
    if (localStorage.getItem("luxe-gift-code")) return false;      // already claimed
    if (localStorage.getItem("luxe-gift-dismissed")) return false; // declined
    return true;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const { mode, install, canInstall } = useInstall();
  const site = useSiteSettings() as { name?: string };
  const [show, setShow] = useState(false);
  const [sheet, setSheet] = useState(false);   // iOS instruction panel

  useEffect(() => {
    // the service worker powers both offline use and notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!canInstall) return;
    if (giftPending()) return;   // the gift offer is the better ask
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch { return; }

    // after the welcome screen has been dealt with, not on top of it
    const t = setTimeout(() => {
      if (claimSlot("install")) setShow(true);
    }, 9000);
    return () => clearTimeout(t);
  }, [canInstall]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
    setSheet(false);
    releaseSlot("install");
  };

  const onInstall = async () => {
    if (mode === "ios") { setSheet(true); return; }
    const ok = await install();
    if (ok) dismiss();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {sheet ? (
        <motion.div
          key="sheet"
          className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="glass-raised p-6 w-full max-w-sm"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-3xl text-center mb-3" aria-hidden>📲</p>
            <h2 className="font-display text-xl font-bold text-center">
              הוספה למסך הבית
            </h2>
            <p className="text-smoke text-sm text-center mt-2">
              שני צעדים, ו-{site.name || "LUXE"} יהיה אצלך כמו אפליקציה
            </p>

            <ol className="mt-6 space-y-4">
              {[
                ["1", "לחצו על כפתור השיתוף", "הריבוע עם החץ למעלה, בתחתית המסך"],
                ["2", "בחרו «הוספה למסך הבית»", "גללו מעט ברשימה כדי למצוא אותו"],
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
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="bar"
          className="fixed bottom-24 inset-x-4 z-[88] max-w-sm mx-auto"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass-raised p-4 flex items-center gap-3">
            <span className="text-2xl shrink-0" aria-hidden>📱</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">התקינו את האפליקציה</p>
              <p className="text-smoke text-xs mt-0.5">
                גישה מהירה והתראות על מבצעים
              </p>
            </div>
            <button onClick={onInstall} className="btn-gold px-4 py-2 text-sm shrink-0">
              התקנה
            </button>
            <button onClick={dismiss} aria-label="סגירה"
              className="text-smoke text-xl leading-none shrink-0">×</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
