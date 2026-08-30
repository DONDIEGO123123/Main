"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import AddToCart from "@/components/AddToCart";
import type { Product } from "@/lib/types";

function useCountdown(endsAt?: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) { setLeft(null); return; }
    const tick = () => setLeft(new Date(endsAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return left;
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

export default function DealOfDay({ product, dealPrice, endsAt }: { product: Product; dealPrice?: number; endsAt?: string }) {
  const left = useCountdown(endsAt);
  const price = dealPrice && dealPrice > 0 ? dealPrice : product.price;
  const compare = dealPrice && dealPrice > 0 ? product.price : product.compare_at_price;
  const discount = compare && compare > price ? Math.round((1 - price / compare) * 100) : null;
  const expired = left !== null && left <= 0;
  if (expired) return null;

  const dealProduct = { ...product, price };
  const d = left !== null ? {
    h: Math.floor(left / 3.6e6), m: Math.floor((left % 3.6e6) / 6e4), s: Math.floor((left % 6e4) / 1000),
  } : null;

  return (
    <div className="glass-gold overflow-hidden grid md:grid-cols-2">
      <div className="relative aspect-square md:aspect-auto bg-panel min-h-64">
        {product.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={product.image_url} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : <div className="absolute inset-0 grid place-items-center text-gold/30 text-7xl">✦</div>}
        <span className="absolute top-4 right-4 rounded-full bg-red-500 text-white text-sm font-bold px-4 py-1.5 animate-pulse">
          🔥 DEAL OF THE DAY
        </span>
      </div>
      <div className="p-8 flex flex-col justify-center">
        <h3 className="font-display text-3xl font-bold">{product.name}</h3>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-gold text-3xl font-black">{formatPrice(price)}</span>
          {compare && compare > price && <span className="text-smoke line-through text-lg">{formatPrice(compare)}</span>}
          {discount && <span className="rounded-full bg-gold text-ink text-sm font-bold px-3 py-1">{discount}%-</span>}
        </div>
        {d && (
          <div className="mt-5">
            <p className="text-smoke text-sm mb-2">⏳ המבצע מסתיים בעוד</p>
            <div className="flex gap-2">
              {[["שעות", d.h], ["דקות", d.m], ["שניות", d.s]].map(([lbl, v]) => (
                <div key={lbl as string} className="glass px-4 py-2 text-center min-w-16">
                  <motion.span key={v as number} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="font-display text-2xl font-black text-gold tabular-nums block">{pad(v as number)}</motion.span>
                  <span className="text-[10px] text-smoke">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <AddToCart product={dealProduct} className="mt-6 py-3" />
      </div>
    </div>
  );
}
