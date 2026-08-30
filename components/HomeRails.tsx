"use client";
import ProductRail from "@/components/ProductRail";
import { getBestSellers, getJustDropped, getForYou } from "@/lib/insights";
import { useLang } from "@/lib/i18n";

/** Best sellers / new arrivals / personal picks — each hides itself without real data. */
export default function HomeRails() {
  const { t } = useLang();
  return (
    <>
      <ProductRail
        title={`🔥 ${t("bestSellers")}`}
        subtitle="המוצרים המבוקשים ביותר אצלנו"
        load={() => getBestSellers(4)}
        badge={(i) => (i === 0 ? "🏆 #1" : i === 1 ? "🔥 פופולרי" : null)}
      />
      <ProductRail
        title={`🆕 ${t("justDropped")}`}
        subtitle="הגיעו לאחרונה"
        load={() => getJustDropped(4)}
        badge={(i) => (i === 0 ? "NEW" : null)}
      />
      <ProductRail
        title={`👋 ${t("forYou")}`}
        subtitle="לפי המוצרים שצפית בהם"
        load={() => getForYou(4)}
      />
    </>
  );
}
