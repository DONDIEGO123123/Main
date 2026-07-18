import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import DeliveryMap from "@/components/DeliveryMap";
import SectionTitle from "@/components/SectionTitle";
import FadeIn from "@/components/FadeIn";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "אזורי משלוח",
  description: "מפת אזורי המשלוח שלנו בישראל — זמני אספקה ועלויות לכל אזור.",
};

export default async function DeliveryPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("delivery_areas").select("*").eq("is_active", true);
  return (
    <div className="mx-auto max-w-7xl px-4 pt-14">
      <SectionTitle eyebrow="בכל הארץ" title="אזורי משלוח" sub="בחרו אזור על המפה כדי לראות זמן אספקה ודמי משלוח." />
      <FadeIn><DeliveryMap areas={data ?? []} /></FadeIn>
    </div>
  );
}
