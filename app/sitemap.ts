import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Derives the public site URL, falling back to the Vercel-provided host. */
function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim()) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "https://example.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const pages = ["", "/products", "/promotions", "/delivery", "/reviews", "/faq", "/contact", "/community"];
  const staticEntries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  // include every active product so search engines can index them
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    if (SUPABASE_URL) {
      const supabase = await createClient();
      const { data } = await supabase.from("products")
        .select("id,updated_at,created_at").eq("is_active", true).limit(1000);
      productEntries = ((data ?? []) as { id: string; updated_at?: string; created_at?: string }[])
        .map((p) => ({
          url: `${base}/products/${p.id}`,
          lastModified: new Date(p.updated_at ?? p.created_at ?? Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
    }
  } catch { /* a sitemap without products is better than a broken build */ }

  return [...staticEntries, ...productEntries];
}
