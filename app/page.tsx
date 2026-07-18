import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeroSlider from "@/components/HeroSlider";
import ProductsShowcase from "@/components/ProductsShowcase";
import PromoBanner from "@/components/PromoBanner";
import ReviewCard from "@/components/ReviewCard";
import FaqAccordion from "@/components/FaqAccordion";
import DeliveryMap from "@/components/DeliveryMap";
import ContactForm from "@/components/ContactForm";
import FadeIn from "@/components/FadeIn";
import Counter from "@/components/Counter";
import SectionTitle from "@/components/SectionTitle";

export const revalidate = 60;

const whyUs = [
  { icon: "✦", title: "איכות ללא פשרות", text: "כל פריט נבחר בקפידה ועובר בקרת איכות לפני שהוא מגיע אליכם." },
  { icon: "⚡", title: "משלוח מהיר", text: "אספקה עד 24–48 שעות לרוב אזורי הארץ, עם עדכונים בכל שלב." },
  { icon: "♛", title: "שירות אישי", text: "מענה אנושי ומהיר בטלגרם ובוואטסאפ, לפני ואחרי הרכישה." },
  { icon: "🛡", title: "קנייה בטוחה", text: "אחריות מלאה על כל מוצר ואפשרות החזרה עד 14 יום." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const [banners, featured, promos, reviews, faq, areas, sectionsRow] = await Promise.all([
    supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).limit(8),
    supabase.from("promotions").select("*").eq("is_active", true).order("sort_order").limit(2),
    supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false }).limit(6),
    supabase.from("faq").select("*").eq("is_active", true).order("sort_order").limit(6),
    supabase.from("delivery_areas").select("*").eq("is_active", true),
    supabase.from("settings").select("value").eq("key", "homepage_sections").single(),
  ]);

  const show = (k: string) => (sectionsRow.data?.value as Record<string, boolean> | undefined)?.[k] !== false;

  return (
    <>
      {show("hero") && <HeroSlider banners={banners.data ?? []} />}

      {/* Stats strip */}
      <section className="mx-auto max-w-7xl px-4 -mt-10 relative z-10">
        <FadeIn className="glass-gold grid grid-cols-3 divide-x divide-x-reverse divide-white/10 text-center py-8">
          <div><Counter to={1200} suffix="+" /><p className="text-smoke text-sm mt-1">לקוחות מרוצים</p></div>
          <div><Counter to={98} suffix="%" /><p className="text-smoke text-sm mt-1">חוזרים לקנות</p></div>
          <div><Counter to={24} /><p className="text-smoke text-sm mt-1">שעות למשלוח</p></div>
        </FadeIn>
      </section>

      {show("featured") && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn>
            <SectionTitle eyebrow="הנבחרים" title="מוצרים מובילים" sub="הפריטים שהלקוחות שלנו הכי אוהבים." />
          </FadeIn>
          <ProductsShowcase products={featured.data ?? []} />
          <div className="text-center mt-10">
            <Link href="/products" className="btn-ghost">לכל המוצרים</Link>
          </div>
        </section>
      )}

      {show("promotions") && (promos.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn>
            <SectionTitle eyebrow="שווה לבדוק" title="מבצעים חמים" />
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {promos.data!.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.1}><PromoBanner promo={p} /></FadeIn>
            ))}
          </div>
        </section>
      )}

      {show("why_us") && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn>
            <SectionTitle eyebrow="ההבטחה שלנו" title="למה לבחור בנו" />
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyUs.map((w, i) => (
              <FadeIn key={w.title} delay={i * 0.08}>
                <div className="glass p-7 h-full hover:border-gold/30 hover:shadow-glow transition-all duration-500">
                  <span className="text-gold text-3xl">{w.icon}</span>
                  <h3 className="font-display text-xl font-bold mt-4">{w.title}</h3>
                  <p className="text-smoke mt-2 text-sm leading-relaxed">{w.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {show("delivery") && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn>
            <SectionTitle eyebrow="בכל הארץ" title="אזורי משלוח" sub="בחרו אזור על המפה לפרטי אספקה ועלויות." />
          </FadeIn>
          <FadeIn><DeliveryMap areas={areas.data ?? []} /></FadeIn>
        </section>
      )}

      {show("reviews") && (reviews.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn>
            <SectionTitle eyebrow="מה אומרים" title="לקוחות ממליצים" />
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.data!.map((r, i) => (
              <FadeIn key={r.id} delay={i * 0.06}><ReviewCard review={r} /></FadeIn>
            ))}
          </div>
        </section>
      )}

      {show("faq") && (faq.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-3xl px-4 mt-24">
          <FadeIn>
            <SectionTitle eyebrow="יש שאלות?" title="שאלות נפוצות" />
          </FadeIn>
          <FadeIn><FaqAccordion items={faq.data!} /></FadeIn>
        </section>
      )}

      {show("contact") && (
        <section className="mx-auto max-w-3xl px-4 mt-24">
          <FadeIn>
            <SectionTitle eyebrow="נשמח לשמוע" title="דברו איתנו" sub="השאירו הודעה או כתבו לנו ישירות בטלגרם ובוואטסאפ." />
          </FadeIn>
          <FadeIn><ContactForm /></FadeIn>
        </section>
      )}
    </>
  );
}
