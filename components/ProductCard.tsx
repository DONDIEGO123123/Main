"use client";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/useCart";
import { useLang } from "@/lib/i18n";
import { useMember } from "@/lib/member";
import { canAccess, inEarlyAccess } from "@/lib/wallet";
import { openCart } from "@/components/CartDrawer";
import HoloMedia from "@/components/HoloMedia";
import HolographicCard from "@/components/HolographicCard";
import CompareButton from "@/components/CompareButton";

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
  const { member } = useMember();

  const locked =
    !canAccess(product.min_level, member?.level) ||
    (inEarlyAccess(product.early_access_until) && !canAccess("vip", member?.level));

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null;

  const soldOut = product.stock === 0;

  return (
    <HolographicCard
      media={
        <>
          {/* the product floats slightly further than its frame */}
          <div className="holo-card__float h-full w-full">
            <HoloMedia
              src={product.image_url}
              video={product.videos?.[0] ?? null}
              alt={product.name}
            />
          </div>

          {locked && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/75 backdrop-blur-sm">
              <div className="text-center px-4">
                <p className="text-3xl">🔒</p>
                <p className="text-gold text-sm font-semibold mt-2">
                  {inEarlyAccess(product.early_access_until)
                    ? "גישה מוקדמת ל-VIP"
                    : "בלעדי לחברי מועדון"}
                </p>
              </div>
            </div>
          )}

          {soldOut && !locked && (
            <span className="absolute top-3 right-3 z-20 rounded-full bg-black/70 border border-white/20 text-white text-xs px-3 py-1">
              {t("soldOut")}
            </span>
          )}

          {discount && !soldOut && (
            <span className="absolute top-3 right-3 z-20 rounded-full bg-gold text-ink text-xs font-bold px-3 py-1">
              {discount}%-
            </span>
          )}

          {product.badge && !discount && !soldOut && (
            <span className="absolute top-3 right-3 z-20 rounded-full glass-gold text-gold text-xs px-3 py-1">
              {product.badge}
            </span>
          )}

          <div className="absolute bottom-3 left-3 z-20">
            <CompareButton id={product.id} />
          </div>

          {onWish && (
            <button
              aria-label="הוספה למועדפים"
              onClick={() => onWish(product.id)}
              className={`absolute top-3 left-3 z-20 h-9 w-9 grid place-items-center rounded-full backdrop-blur border transition ${
                wished
                  ? "bg-gold text-ink border-gold"
                  : "bg-black/40 border-white/20 text-white hover:text-gold"
              }`}
            >
              ♥
            </button>
          )}

          {/* actions stay reachable by keyboard even without hover */}
          <div className="absolute inset-x-3 bottom-3 z-20 flex gap-2 opacity-0 translate-y-3
                          transition-all duration-300
                          group-hover:opacity-100 group-hover:translate-y-0
                          group-focus-within:opacity-100 group-focus-within:translate-y-0">
            {onQuickView ? (
              <button onClick={() => onQuickView(product)} className="btn-ghost flex-1 py-2 text-sm">
                {t("quickView")}
              </button>
            ) : (
              <Link
                href={`/products/${product.id}`}
                className="btn-ghost flex-1 py-2 text-sm text-center"
              >
                {t("quickView")}
              </Link>
            )}
            <button
              onClick={() => { add(product, 1); openCart(); }}
              disabled={soldOut || locked}
              className="btn-gold flex-1 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("addToCart")}
            </button>
          </div>
        </>
      }
    >
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
    </HolographicCard>
  );
}
