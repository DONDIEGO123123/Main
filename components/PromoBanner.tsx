"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Promotion } from "@/lib/types";

export default function PromoBanner({ promo, big = false }: { promo: Promotion; big?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`relative overflow-hidden rounded-3xl border border-gold/25 shadow-card group ${
        big ? "min-h-[320px] md:min-h-[420px]" : "min-h-[220px]"
      }`}
    >
      {promo.image_url ? (
        <Image
          src={promo.image_url}
          alt={promo.title}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-panel via-ink to-gold/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/40 to-transparent" />
      <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
        <h3 className={`font-display font-black ${big ? "text-3xl md:text-5xl" : "text-2xl"}`}>
          <span className="gold-text">{promo.title}</span>
        </h3>
        {promo.subtitle && <p className="mt-2 text-smoke max-w-md">{promo.subtitle}</p>}
        {promo.cta_label && (
          <Link href={promo.cta_url || "/products"} className="btn-gold mt-5 self-start py-2.5 text-sm">
            {promo.cta_label}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
