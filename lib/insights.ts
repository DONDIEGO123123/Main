import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

/** Products ranked by how often they appear in real orders. */
export async function getBestSellers(limit = 6): Promise<Product[]> {
  const s = createClient();
  const { data: orders } = await s.from("orders").select("items,status").neq("status", "cancelled").limit(500);

  const counts = new Map<string, number>();
  ((orders ?? []) as { items: { product_id: string; qty: number }[] }[]).forEach((o) => {
    (o.items ?? []).forEach((i) => counts.set(i.product_id, (counts.get(i.product_id) ?? 0) + i.qty));
  });

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  if (ranked.length === 0) return [];

  const { data } = await s.from("products").select("*").in("id", ranked).eq("is_active", true);
  const byId = new Map(((data ?? []) as Product[]).map((p) => [p.id, p]));
  return ranked.map((id) => byId.get(id)).filter(Boolean) as Product[];
}

/** Newest active products. */
export async function getJustDropped(limit = 4): Promise<Product[]> {
  const { data } = await createClient().from("products").select("*")
    .eq("is_active", true).order("created_at", { ascending: false }).limit(limit);
  return (data as Product[]) ?? [];
}

/** Personal picks from the categories this visitor has viewed. */
export async function getForYou(limit = 4): Promise<Product[]> {
  if (typeof window === "undefined") return [];
  let recent: string[] = [];
  try { recent = JSON.parse(localStorage.getItem("luxe-recent") ?? "[]"); } catch { /* empty */ }
  if (recent.length === 0) return [];

  const s = createClient();
  const { data: seen } = await s.from("products").select("category_id").in("id", recent.slice(0, 10));
  const cats = [...new Set(((seen ?? []) as { category_id: string | null }[])
    .map((c) => c.category_id).filter(Boolean))] as string[];
  if (cats.length === 0) return [];

  const { data } = await s.from("products").select("*")
    .in("category_id", cats).eq("is_active", true)
    .not("id", "in", `(${recent.slice(0, 10).join(",")})`).limit(limit);
  return (data as Product[]) ?? [];
}
