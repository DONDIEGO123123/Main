"use client";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/useCart";
import { useLang } from "@/lib/i18n";
import { openCart } from "@/components/CartDrawer";
import Link from "next/link";
import HoloMedia from "@/components/HoloMedia";

export default function ProductCard({
  product,
  onQuickView,
  wished,
  onWish,
}: {
  product: Product;
  onQuickView?: (p: Product) => void;
  wished?: boolean;
  onWish?: (id: string) => void;
}) {
  const { add } = useCart();
  const { t } = useLang();
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass group overflow-hidden hover:border-gold/30 hover:shadow-glow transition-all duration-500"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-panel">
        <HoloMedia
          src={product.image_url}
          video={product.videos?.[0] ?? null}
          alt={product.name}
          className="absolute inset-0"
        />
        {discount && (
          <span className="absolute top-3 right-3 rounded-full bg-gold text-ink text-xs font-bold px-3 py-1">
            {discount}%-
          </span>
        )}
        {onWish && (
          <button
            aria-label="הוספה למועדפים"
            onClick={() => onWish(product.id)}
            className={`absolute top-3 left-3 h-9 w-9 grid place-items-center rounded-full backdrop-blur border transition ${
              wished ? "bg-gold text-ink border-gold" : "bg-black/40 border-white/20 text-white hover:text-gold"
            }`}
          >
            ♥
          </button>
        )}
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex gap-2">
          {onQuickView ? (
            <button onClick={() => onQuickView(product)} className="btn-ghost flex-1 py-2 text-sm">
              {t("quickView")}
            </button>
          ) : (
            <Link href={`/products/${product.id}`} className="btn-ghost flex-1 py-2 text-sm text-center">
              {t("quickView")}
            </Link>
          )}
          <button onClick={() => { add(product, 1); openCart(); }} className="btn-gold flex-1 py-2 text-sm">
            {t("addToCart")}
          </button>
        </div>
      </div>
      <div className="p-4">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="font-semibold truncate hover:text-gold transition">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-gold font-bold">{formatPrice(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-smoke text-sm line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
