"use client";
import { useState } from "react";
import { useCart } from "@/lib/useCart";
import { useLang } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export default function AddToCart({ product, className = "" }: { product: Product; className?: string }) {
  const { add } = useCart();
  const { t } = useLang();
  const [done, setDone] = useState(false);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(product);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };

  const soldOut = product.stock === 0;

  return (
    <button onClick={onAdd} disabled={soldOut}
      className={`btn-gold py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition ${className}`}>
      {soldOut ? t("soldOut") : done ? `✓ ${t("added")}` : t("addToCart")}
    </button>
  );
}
