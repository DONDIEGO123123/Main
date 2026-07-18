"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Banner } from "@/lib/types";

const fallback: Banner[] = [
  {
    id: "f1",
    headline: "יוקרה שנבנתה בשבילך",
    subheadline: "קולקציית פרימיום נבחרת, משלוח מהיר עד הבית ושירות אישי ברמה אחרת.",
    image_url: null,
    cta_label: "לצפייה בקולקציה",
    cta_url: "/products",
    is_active: true,
    sort_order: 0,
  },
];

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const slides = banners.length ? banners : fallback;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const s = slides[i];

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      {/* Animated aurora background */}
      <div aria-hidden className="absolute inset-0">
        <motion.div
          className="absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-gold/15 blur-[120px]"
          animate={{ x: [0, -60, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-[120px]"
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        {s.image_url && (
          <Image src={s.image_url} alt="" fill priority className="object-cover opacity-25" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="text-gold tracking-[0.35em] text-sm font-semibold mb-5">PREMIUM COLLECTION</p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1]">
              <span className="gold-text">{s.headline}</span>
            </h1>
            <p className="mt-6 text-lg text-smoke leading-relaxed max-w-xl">{s.subheadline}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={s.cta_url || "/products"} className="btn-gold">
                {s.cta_label || "לצפייה בקולקציה"}
              </Link>
              <Link href="/contact" className="btn-ghost">דברו איתנו</Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <div className="absolute bottom-8 right-4 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`שקופית ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-8 bg-gold" : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
