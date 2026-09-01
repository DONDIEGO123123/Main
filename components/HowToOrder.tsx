"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSiteSettings } from "@/lib/site";

type Step = {
  n: number;
  title: string;
  body: string;
  /** each step draws its own little illustration */
  art: "browse" | "cart" | "form" | "whatsapp";
};

const STEPS: Step[] = [
  { n: 1, title: "בוחרים מוצר", body: "מעיינים בקטלוג ולוחצים \u201eהוספה לעגלה\u201d על מה שאהבתם.", art: "browse" },
  { n: 2, title: "פותחים את העגלה", body: "כפתור העגלה מופיע בפינה. אפשר לשנות כמויות או להסיר פריטים.", art: "cart" },
  { n: 3, title: "ממלאים פרטים", body: "שם, טלפון ואזור משלוח. דמי המשלוח מחושבים אוטומטית לפי האזור.", art: "form" },
  { n: 4, title: "ממשיכים בוואטסאפ", body: "נפתחת שיחה איתנו עם כל פרטי ההזמנה מוכנים. משם נסגור הכל אישית.", art: "whatsapp" },
];

const DURATION = 4200;

/* ---------- step illustrations, drawn in SVG ---------- */

function Art({ kind, active }: { kind: Step["art"]; active: boolean }) {
  const stroke = "rgba(212,175,55,.9)";
  const faint = "rgba(255,255,255,.14)";

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  } as const;

  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-hidden>
      {/* device frame, shared by every step */}
      <rect x="58" y="12" width="84" height="126" rx="12" fill="none" stroke={faint} strokeWidth="1.5" />
      <rect x="86" y="18" width="28" height="4" rx="2" fill={faint} />

      {kind === "browse" && (
        <>
          {[0, 1].map((r) =>
            [0, 1].map((c) => (
              <motion.rect
                key={`${r}${c}`}
                x={66 + c * 36} y={32 + r * 44} width="30" height="38" rx="5"
                fill="rgba(212,175,55,.08)" stroke={stroke} strokeWidth="1"
                initial={{ opacity: 0, y: 6 }}
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
                transition={{ delay: 0.15 + (r * 2 + c) * 0.09, duration: 0.4 }}
              />
            ))
          )}
          <motion.circle
            cx="132" cy="112" r="7" fill={stroke}
            initial={{ scale: 0 }}
            animate={active ? { scale: [0, 1.25, 1] } : { scale: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
        </>
      )}

      {kind === "cart" && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.g key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
            >
              <rect x="66" y={36 + i * 26} width="20" height="20" rx="4" fill="rgba(212,175,55,.12)" stroke={stroke} strokeWidth="1" />
              <rect x="92" y={41 + i * 26} width="40" height="3" rx="1.5" fill={faint} />
              <rect x="92" y={48 + i * 26} width="22" height="3" rx="1.5" fill="rgba(212,175,55,.5)" />
            </motion.g>
          ))}
          <motion.rect
            x="66" y="118" width="68" height="14" rx="7" fill={stroke}
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          />
        </>
      )}

      {kind === "form" && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.g key={i}>
              <rect x="66" y={38 + i * 24} width="68" height="14" rx="4" fill="none" stroke={faint} strokeWidth="1" />
              <motion.rect
                x="70" y={43 + i * 24} height="4" rx="2" fill="rgba(212,175,55,.65)"
                initial={{ width: 0 }}
                animate={active ? { width: [0, 40, 46] } : { width: 0 }}
                transition={{ delay: 0.25 + i * 0.35, duration: 0.7 }}
              />
            </motion.g>
          ))}
          <motion.rect
            x="66" y="115" width="68" height="15" rx="7.5" fill={stroke}
            initial={{ opacity: 0.25 }}
            animate={active ? { opacity: [0.25, 1] } : { opacity: 0.25 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          />
        </>
      )}

      {kind === "whatsapp" && (
        <>
          <motion.path
            d="M74 48 h52 a6 6 0 0 1 6 6 v22 a6 6 0 0 1 -6 6 h-34 l-12 10 v-10 h-6 a6 6 0 0 1 -6 -6 v-22 a6 6 0 0 1 6 -6 z"
            fill="rgba(37,211,102,.12)" stroke="rgba(37,211,102,.9)" strokeWidth="1.5"
            variants={draw} initial="hidden" animate={active ? "show" : "hidden"}
          />
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i} cx={90 + i * 12} cy="65" r="3" fill="rgba(37,211,102,.9)"
              initial={{ opacity: 0.2 }}
              animate={active ? { opacity: [0.2, 1, 0.2] } : { opacity: 0.2 }}
              transition={{ delay: 0.9 + i * 0.18, duration: 1.1, repeat: Infinity }}
            />
          ))}
          <motion.path
            d="M84 104 l10 10 l20 -22"
            fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            variants={draw} initial="hidden" animate={active ? "show" : "hidden"}
            transition={{ delay: 1.1, duration: 0.6 }}
          />
        </>
      )}
    </svg>
  );
}

/* ---------- the guide ---------- */

export default function HowToOrder() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useReducedMotion();
  const site = useSiteSettings() as { how_to_title?: string };
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing || reduced) return;
    timer.current = setInterval(() => setI((p) => (p + 1) % STEPS.length), DURATION);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, reduced]);

  const go = (n: number) => { setI(n); setPlaying(false); };
  const step = STEPS[i];

  return (
    <section className="mx-auto max-w-7xl px-4 mt-24">
      <div className="text-center mb-12">
        <h2 className="section-title">{site.how_to_title || "איך מזמינים?"}</h2>
        <p className="mt-4 text-smoke">ארבעה שלבים, פחות משתי דקות</p>
        <div className="rule mt-6 w-24 mx-auto" aria-hidden />
      </div>

      <div className="glass-thin p-6 md:p-10 grid lg:grid-cols-2 gap-10 items-center">
        {/* animated illustration */}
        <div
          className="relative aspect-[4/3] rounded-2xl bg-ink-deep/60 border border-white/[0.06] overflow-hidden"
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => setPlaying(true)}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(circle 45% at 50% 40%, rgba(212,175,55,.12), transparent 70%)",
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={step.n}
              className="absolute inset-0 p-6"
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Art kind={step.art} active />
            </motion.div>
          </AnimatePresence>

          <span className="absolute top-4 right-4 font-display text-5xl font-black text-gold/20 tabular-nums">
            {step.n}
          </span>
        </div>

        {/* steps list — clickable, and readable without any animation */}
        <div>
          <ol className="space-y-1">
            {STEPS.map((s, idx) => {
              const on = idx === i;
              return (
                <li key={s.n}>
                  <button
                    onClick={() => go(idx)}
                    aria-current={on}
                    className={`w-full text-right flex gap-4 p-4 rounded-xl transition-colors duration-base ease-luxe ${
                      on ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`shrink-0 h-8 w-8 rounded-full grid place-items-center text-sm font-semibold transition-colors duration-base ease-luxe ${
                        on ? "bg-gold text-ink" : "border border-white/15 text-smoke"
                      }`}
                    >
                      {s.n}
                    </span>
                    <span className="flex-1">
                      <span className={`block font-semibold ${on ? "text-white" : "text-white/70"}`}>
                        {s.title}
                      </span>
                      <span className="block text-sm text-smoke mt-1 leading-relaxed">{s.body}</span>

                      {/* the bar doubles as the autoplay timer */}
                      {on && !reduced && (
                        <span className="block h-px mt-3 bg-white/10 overflow-hidden rounded-full">
                          <motion.span
                            key={`${s.n}-${playing}`}
                            className="block h-full bg-metal"
                            initial={{ width: "0%" }}
                            animate={{ width: playing ? "100%" : "0%" }}
                            transition={{ duration: playing ? DURATION / 1000 : 0, ease: "linear" }}
                          />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <Link href="/products" className="btn-gold w-full mt-6 py-3.5">
            להתחיל להזמין ←
          </Link>
        </div>
      </div>
    </section>
  );
}
