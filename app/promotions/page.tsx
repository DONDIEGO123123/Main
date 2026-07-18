import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PromoBanner from "@/components/PromoBanner";
import FadeIn from "@/components/FadeIn";
import SectionTitle from "@/components/SectionTitle";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "מבצעים",
  description: "כל המבצעים וההטבות הפעילים — לזמן מוגבל.",
};

export default async function PromotionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("promotions").select("*").eq("is_active", true).order("sort_order");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-14">
      <SectionTitle eyebrow="לזמן מוגבל" title="מבצעים והטבות" />
      {!data?.length ? (
        <div className="glass p-14 text-center text-smoke">אין מבצעים פעילים כרגע — שווה לחזור בקרוב.</div>
      ) : (
        <div className="space-y-8">
          {data.map((p, i) => (
            <FadeIn key={p.id} delay={i * 0.08}><PromoBanner promo={p} big /></FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
