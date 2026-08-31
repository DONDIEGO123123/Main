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
    <section className="relative min-h-[92vh] flex items-end overflow-hidden">
      {/* Ambient stage: cold key light above, warm bounce below */}
      <div aria-hidden className="absolute inset-0">
        <motion.div
          className="absolute -top-48 right-[-12%] h-[40rem] w-[40rem] rounded-full bg-steel-glow/20 blur-[140px]"
          animate={{ x: [0, -50, 0], y: [0, 36, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-25%] left-[-12%] h-[32rem] w-[32rem] rounded-full bg-gold/12 blur-[140px]"
          animate={{ x: [0, 50, 0], y: [0, -32, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />

        {s.image_url && (
          <>
            <Image
              src={s.image_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40 scale-105"
            />
            {/* the image is the hero — the scrim only protects the type */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/15" />
            <div className="absolute inset-0 bg-gradient-to-l from-ink/70 via-transparent to-transparent" />
          </>
        )}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            {/* one orchestrated entrance, staggered by line */}
            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="hero-title"
            >
              <span className="metal-text">{s.headline}</span>
            </motion.h1>

            {s.subheadline && (
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="mt-7 text-lg md:text-xl text-white/70 leading-relaxed max-w-xl"
              >
                {s.subheadline}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link href={s.cta_url || "/products"} className="btn-gold">
                {s.cta_label || "לצפייה בקולקציה"}
              </Link>
              <Link href="/contact" className="btn-ghost">דברו איתנו</Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <div className="mt-14 flex items-center gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`שקופית ${idx + 1}`}
                aria-current={idx === i}
                onClick={() => setI(idx)}
                className="group py-2"
              >
                <span
                  className={`block h-px transition-all duration-slow ease-luxe ${
                    idx === i
                      ? "w-14 bg-gold"
                      : "w-7 bg-white/25 group-hover:bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* the seam into the catalogue, softened */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent"
      />
    </section>
  );
}
