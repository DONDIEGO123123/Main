"use client";
import ProductRail from "@/components/ProductRail";
import { getBestSellers, getJustDropped, getForYou } from "@/lib/insights";

/** Best sellers / new arrivals / personal picks — each hides itself without real data. */
export default function HomeRails() {
  return (
    <>
      <ProductRail
        title="🔥 מה כולם לוקחים"
        subtitle="המוצרים המבוקשים ביותר אצלנו"
        load={() => getBestSellers(4)}
        badge={(i) => (i === 0 ? "🏆 #1" : i === 1 ? "🔥 פופולרי" : null)}
      />
      <ProductRail
        title="🆕 חדש בחנות"
        subtitle="הגיעו לאחרונה"
        load={() => getJustDropped(4)}
        badge={(i) => (i === 0 ? "NEW" : null)}
      />
      <ProductRail
        title="👋 אולי תאהב גם"
        subtitle="לפי המוצרים שצפית בהם"
        load={() => getForYou(4)}
      />
    </>
  );
}
