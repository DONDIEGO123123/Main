"use client";
import { useState } from "react";
import ProductCard from "./ProductCard";
import QuickView from "./QuickView";
import { useWishlist, pushRecent } from "@/lib/useWishlist";
import type { Product } from "@/lib/types";

export default function ProductsShowcase({ products }: { products: Product[] }) {
  const [quick, setQuick] = useState<Product | null>(null);
  const wishlist = useWishlist();
  if (!products.length) {
    return <div className="glass p-14 text-center text-smoke">בקרוב יעלו לכאן המוצרים הראשונים.</div>;
  }
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onQuickView={(x) => { pushRecent(x.id); setQuick(x); }}
            wished={wishlist.has(p.id)}
            onWish={wishlist.toggle}
          />
        ))}
      </div>
      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  );
}
