import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductsExplorer from "@/components/ProductsExplorer";
import SectionTitle from "@/components/SectionTitle";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "מוצרים",
  description: "כל קולקציית הפרימיום שלנו — חיפוש, סינון לפי קטגוריה ומיון לפי מחיר.",
};

export default async function ProductsPage() {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 pb-10">
      <SectionTitle eyebrow="הקולקציה" title="המוצרים שלנו" sub="חפשו, סננו לפי קטגוריה ומצאו בדיוק את מה שחיפשתם." />
      <Suspense fallback={<div className="glass p-14 text-center text-smoke">טוען…</div>}>
        <ProductsExplorer products={products.data ?? []} categories={categories.data ?? []} />
      </Suspense>
    </div>
  );
}
