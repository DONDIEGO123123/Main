import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import FaqAccordion from "@/components/FaqAccordion";
import SectionTitle from "@/components/SectionTitle";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "שאלות נפוצות",
  description: "תשובות לשאלות על משלוחים, תשלום, החזרות ויצירת קשר.",
};

export default async function FaqPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("faq").select("*").eq("is_active", true).order("sort_order");
  return (
    <div className="mx-auto max-w-3xl px-4 pt-14">
      <SectionTitle eyebrow="יש שאלות?" title="שאלות נפוצות" />
      <FaqAccordion items={data ?? []} />
    </div>
  );
}
