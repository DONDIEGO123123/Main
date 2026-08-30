import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetail from "./ProductDetail";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product) ?? null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: "מוצר לא נמצא" };
  return {
    title: p.name,
    description: p.description?.slice(0, 150) ?? undefined,
    openGraph: {
      title: p.name,
      description: p.description?.slice(0, 150) ?? undefined,
      images: p.image_url ? [p.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  // Structured data helps the product show up properly in Google results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.image_url ? [product.image_url] : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "ILS",
      availability:
        product.stock === 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
    </>
  );
}
