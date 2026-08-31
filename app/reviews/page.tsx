import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ReviewCard from "@/components/ReviewCard";
import SectionTitle from "@/components/SectionTitle";
import FadeIn from "@/components/FadeIn";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "ביקורות לקוחות",
  description: "מה הלקוחות שלנו מספרים על החוויה, המוצרים והשירות.",
};

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-14">
      <SectionTitle eyebrow="מפי הלקוחות" title="ביקורות אמיתיות" />
      {!data?.length ? (
        <div className="glass-thin p-16 text-center">
          <p className="text-5xl text-gold/25 mb-4" aria-hidden>&rdquo;</p>
          <p className="font-display text-xl">עוד אין ביקורות</p>
          <p className="text-smoke text-sm mt-2 max-w-sm mx-auto">
            הזמנתם כבר? נשמח לשמוע איך הייתה החוויה.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((r, i) => (
            <FadeIn key={r.id} delay={(i % 3) * 0.06}><ReviewCard review={r} /></FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
