"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";

type Budget = { label: string; max: number };
const budgets: Budget[] = [
  { label: "עד ₪200", max: 200 },
  { label: "₪200–500", max: 500 },
  { label: "₪500–1000", max: 1000 },
  { label: "₪1000+", max: Infinity },
];

/** Simple recommendation wizard over existing products/categories — no AI. */
export default function ChooseWizard({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const reset = () => { setStep(0); setBudget(null); setCat(null); };

  const results = products
    .filter((p) => (budget ? p.price <= budget.max : true))
    .filter((p) => (cat ? p.category_id === cat : true))
    .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    .slice(0, 3);

  return (
    <>
      <button onClick={() => { reset(); setOpen(true); }}
        className="glass-gold w-full py-6 px-6 flex items-center justify-center gap-3 hover:shadow-glow transition group">
        <span className="text-3xl">🤔</span>
        <span className="font-display text-xl font-bold">לא יודע מה לבחור?</span>
        <span className="text-gold group-hover:translate-x-[-4px] transition">←</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[75] grid place-items-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative glass-gold w-full max-w-lg p-8">
              <button onClick={() => setOpen(false)} className="absolute top-4 left-4 h-9 w-9 rounded-full glass text-xl leading-none">×</button>

              {/* progress */}
              <div className="flex gap-1.5 mb-6">
                {[0, 1, 2].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-gold" : "bg-white/10"}`} />)}
              </div>

              {step === 0 && (
                <div>
                  <h3 className="font-display text-2xl font-bold mb-6">מה התקציב שלך?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {budgets.map((b) => (
                      <button key={b.label} onClick={() => { setBudget(b); setStep(1); }} className="btn-ghost py-4">{b.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="font-display text-2xl font-bold mb-6">מה אתה מחפש?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setCat(null); setStep(2); }} className="btn-ghost py-4 col-span-2">הכל / לא משנה</button>
                    {categories.map((c) => (
                      <button key={c.id} onClick={() => { setCat(c.id); setStep(2); }} className="btn-ghost py-4">{c.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="font-display text-xl font-bold mb-1">לפי הבחירות שלך:</h3>
                  <p className="text-smoke text-sm mb-5">אלה המוצרים שמתאימים לך</p>
                  {results.length === 0 ? (
                    <p className="text-smoke text-center py-8">לא נמצאה התאמה מדויקת. <Link href="/products" className="text-gold">לכל המוצרים ←</Link></p>
                  ) : (
                    <div className="space-y-3">
                      {results.map((p) => (
                        <Link key={p.id} href="/products" onClick={() => setOpen(false)} className="flex gap-3 glass p-3 hover:border-gold/30 transition">
                          <div className="h-16 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-panel">
                            {p.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                            ) : <div className="h-full w-full grid place-items-center text-gold/30">✦</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{p.name}</p>
                            <p className="text-gold text-sm">{formatPrice(p.price)}</p>
                          </div>
                          <span className="self-center text-gold">←</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <button onClick={reset} className="text-smoke text-sm mt-5 hover:text-gold">התחל מחדש</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
