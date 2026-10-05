"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSiteSettings } from "@/lib/site";
import { useInstall } from "@/lib/install";

const KEY = "luxe-welcomed";

/**
 * First-visit welcome screen.
 *
 * Shown once per browser, then never again — a returning customer goes
 * straight to the shop. It also stays out of the way of crawlers and of
 * anyone arriving on a deep link to a specific product.
 */
export default function WelcomeGate() {
  const site = useSiteSettings() as {
    name?: string;
    welcome_title?: string;
    welcome_sub?: string;
    welcome_cta?: string;
    welcome_enabled?: boolean;
  };
  const reduced = useReducedMotion();
  const { mode, install, canInstall } = useInstall();
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    // decide on the client only, so the page itself renders normally
    try {
      const seen = localStorage.getItem(KEY);
      const deepLink = window.location.pathname !== "/";
      if (!seen && !deepLink) setShow(true);
    } catch {
      /* private mode — just show the shop */
    }
    setReady(true);
  }, []);

  const enter = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  };

  // lock scrolling only while the gate is up
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [show]);

  if (!ready) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] bg-ink flex flex-col items-center justify-center px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="ברוכים הבאים"
        >
          {/* the same warm/cool light as the rest of the site */}
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 right-[-15%] h-[34rem] w-[34rem] rounded-full bg-steel-glow/15 blur-[130px]" />
            <div className="absolute bottom-[-25%] left-[-15%] h-[30rem] w-[30rem] rounded-full bg-gold/10 blur-[130px]" />
          </div>

          <motion.div
            className="relative text-center max-w-md"
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-display text-5xl md:text-6xl font-black metal-text tracking-[0.14em]">
              {site.name || "LUXE"}
            </p>

            <div className="rule mt-8 mx-auto w-28" aria-hidden />

            <h1 className="font-display text-2xl md:text-3xl font-bold mt-8">
              {site.welcome_title || "ברוכים הבאים"}
            </h1>

            <p className="text-smoke mt-4 leading-relaxed">
              {site.welcome_sub || "קולקציית פרימיום נבחרת, משלוח מהיר ושירות אישי."}
            </p>

            <motion.div
              className="mt-10 flex flex-col items-center gap-4"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <button onClick={enter} className="btn-gold px-12 py-3.5 text-base">
                {site.welcome_cta || "כניסה"}
              </button>

              {/* installing here is the one moment it feels natural to offer */}
              {canInstall && (
                <button
                  onClick={async () => {
                    if (mode === "ios") { setIosHelp(true); return; }
                    await install();
                  }}
                  className="text-smoke text-sm transition-colors duration-base ease-luxe hover:text-gold"
                >
                  📱 התקנה כאפליקציה
                </button>
              )}
            </motion.div>

            {iosHelp && (
              <div className="mt-6 glass-thin p-5 text-right max-w-xs mx-auto">
                <p className="text-sm font-semibold mb-3 text-center">הוספה למסך הבית</p>
                <ol className="space-y-2.5 text-smoke text-xs leading-relaxed">
                  <li>1. לחצו על כפתור השיתוף בתחתית המסך</li>
                  <li>2. בחרו &laquo;הוספה למסך הבית&raquo;</li>
                </ol>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
