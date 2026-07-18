"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import QuickView from "./QuickView";
import { useWishlist, pushRecent } from "@/lib/useWishlist";
import type { Category, Product } from "@/lib/types";

const PER_PAGE = 12;

export default function ProductsExplorer({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState(params.get("category") ?? "all");
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");
  const [page, setPage] = useState(1);
  const [quick, setQuick] = useState<Product | null>(null);
  const wishlist = useWishlist();

  const catIdBySlug = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.id])),
    [categories]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (cat !== "all") list = list.filter((p) => p.category_id === catIdBySlug[cat]);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t)
      );
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, q, cat, sort, catIdBySlug]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openQuick = (p: Product) => {
    pushRecent(p.id);
    setQuick(p);
  };

  return (
    <div>
      {/* Controls */}
      <div className="glass p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center mb-8">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="חיפוש מוצר…"
          className="input md:max-w-xs"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => { setCat("all"); setPage(1); }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm border transition ${
              cat === "all" ? "bg-gold text-ink border-gold" : "border-white/10 hover:border-gold/40"
            }`}
          >
            הכל
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCat(c.slug); setPage(1); }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm border transition ${
                cat === c.slug ? "bg-gold text-ink border-gold" : "border-white/10 hover:border-gold/40"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="input md:max-w-[180px] md:mr-auto"
        >
          <option value="new">החדשים ביותר</option>
          <option value="price-asc">מחיר: מהנמוך לגבוה</option>
          <option value="price-desc">מחיר: מהגבוה לנמוך</option>
        </select>
      </div>

      {/* Grid */}
      {current.length === 0 ? (
        <div className="glass p-14 text-center text-smoke">
          לא נמצאו מוצרים תואמים. נסו חיפוש אחר או נקו את הסינון.
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {current.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onQuickView={openQuick}
              wished={wishlist.has(p.id)}
              onWish={wishlist.toggle}
            />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`h-10 w-10 rounded-full border text-sm transition ${
                page === i + 1 ? "bg-gold text-ink border-gold" : "border-white/10 hover:border-gold/40"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <QuickView product={quick} onClose={() => setQuick(null)} />
    </div>
  );
}
