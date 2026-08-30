"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function ShareButton({ product }: { product: Product }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/products/${product.id}`;
    const text = `${product.name} — ${formatPrice(product.price)}\n${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={share} className="btn-ghost px-4 py-2.5 text-sm">
      {copied ? "✓ הועתק" : "↗ שיתוף"}
    </button>
  );
}
