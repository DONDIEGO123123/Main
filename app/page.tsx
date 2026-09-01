import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeroSlider from "@/components/HeroSlider";
import ProductsShowcase from "@/components/ProductsShowcase";
import PromoBanner from "@/components/PromoBanner";
import FaqAccordion from "@/components/FaqAccordion";
import DeliveryMap from "@/components/DeliveryMap";
import ContactForm from "@/components/ContactForm";
import ContactChannels from "@/components/ContactChannels";
import FadeIn from "@/components/FadeIn";
import SectionTitle from "@/components/SectionTitle";
import DealOfDay from "@/components/DealOfDay";
import ChooseWizard from "@/components/ChooseWizard";
import SocialProof from "@/components/SocialProof";
import ReviewForm from "@/components/ReviewForm";
import VipClub from "@/components/VipClub";
import JoinBanner from "@/components/JoinBanner";
import HomeRails from "@/components/HomeRails";
import HowToOrder from "@/components/HowToOrder";
import CustomerGallery from "@/components/CustomerGallery";
import HeroVideo from "@/components/HeroVideo";
import RealStats from "@/components/RealStats";
import type { SiteSettings } from "@/lib/types";

export const revalidate = 60;

const defaultWhy = {
  title: "איכות שאתה מרגיש. מחיר שאתה לא מתווכח עליו.",
  items: [
    { icon: "🚚", title: "משלוח לכל הארץ", text: "זמני האספקה והעלות מוצגים לפי אזור בעמוד המשלוחים." },
    { icon: "💎", title: "איכות שנבדקת", text: "כל פריט עובר בקרת איכות לפני שהוא נשלח." },
    { icon: "🔥", title: "מבצעים מתחלפים", text: "הטבות חדשות שמתחדשות כל הזמן." },
    { icon: "💬", title: "שירות אישי", text: "מענה אנושי מהיר בוואטסאפ ובטלגרם." },
  ],
};

export default async function HomePage() {
  const supabase = await createClient();
  const [banners, featured, products, categories, promos, reviews, faq, areas, sectionsRow, siteRow] =
    await Promise.all([
      supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).limit(8),
      supabase.from("products").select("*").eq("is_active", true),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("promotions").select("*").eq("is_active", true).order("sort_order").limit(2),
      supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false }).limit(6),
      supabase.from("faq").select("*").eq("is_active", true).order("sort_order").limit(6),
      supabase.from("delivery_areas").select("*").eq("is_active", true),
      supabase.from("settings").select("value").eq("key", "homepage_sections").single(),
      supabase.from("settings").select("value").eq("key", "site").single(),
    ]);

  const show = (k: string) => (sectionsRow.data?.value as Record<string, boolean> | undefined)?.[k] !== false;
  const site = (siteRow.data?.value as SiteSettings) ?? {};
  const why = { title: site.why_title || defaultWhy.title, items: site.why_items?.length ? site.why_items : defaultWhy.items };

  // Deal of the Day — only if enabled and a product is chosen
  const dealProduct = site.deal_enabled && site.deal_product_id
    ? (products.data ?? []).find((p) => p.id === site.deal_product_id)
    : null;

  return (
    <>
      {show("hero") && <HeroSlider banners={banners.data ?? []} />}

      <RealStats />

      <JoinBanner />

      {/* Why us */}
      {show("why_us") && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center gold-text max-w-3xl mx-auto leading-tight">
              {why.title}
            </h2>
          </FadeIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {why.items.map((w, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="glass p-6 h-full text-center hover:border-gold/30 hover:shadow-glow transition-all duration-500">
                  <span className="text-3xl">{w.icon}</span>
                  <h3 className="font-display text-lg font-bold mt-3">{w.title}</h3>
                  <p className="text-smoke mt-1.5 text-sm leading-relaxed">{w.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* Deal of the Day */}
      {dealProduct && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn><DealOfDay product={dealProduct} dealPrice={site.deal_price} endsAt={site.deal_ends_at} /></FadeIn>
        </section>
      )}

      {/* Best sellers / featured */}
      {show("featured") && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn><SectionTitle eyebrow="הנבחרים" title="מוצרים מובילים" sub="הפריטים שהלקוחות שלנו הכי אוהבים." /></FadeIn>
          <ProductsShowcase products={featured.data ?? []} />
          <div className="text-center mt-10"><Link href="/products" className="btn-ghost">לכל המוצרים</Link></div>
        </section>
      )}

      <HeroVideo />

      <HowToOrder />

      <HomeRails />

      <CustomerGallery />

      {/* Wizard */}
      {site.wizard_enabled !== false && (products.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-2xl px-4 mt-24">
          <ChooseWizard products={products.data ?? []} categories={categories.data ?? []} />
        </section>
      )}

      {/* Promotions */}
      {show("promotions") && (promos.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn><SectionTitle eyebrow="שווה לבדוק" title="מבצעים חמים" /></FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {promos.data!.map((p, i) => <FadeIn key={p.id} delay={i * 0.1}><PromoBanner promo={p} /></FadeIn>)}
          </div>
        </section>
      )}

      {/* Delivery */}
      {show("delivery") && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn><SectionTitle eyebrow="בכל הארץ" title="אזורי משלוח" sub="בחרו אזור על המפה לפרטי אספקה ועלויות." /></FadeIn>
          <FadeIn><DeliveryMap areas={areas.data ?? []} /></FadeIn>
        </section>
      )}

      {/* Social proof */}
      {show("reviews") && (reviews.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-24">
          <FadeIn><SectionTitle eyebrow="מה אומרים" title="לקוחות ממליצים" /></FadeIn>
          <FadeIn><SocialProof reviews={reviews.data ?? []} /></FadeIn>
          <ReviewForm />
        </section>
      )}

      {/* VIP club */}
      {site.vip_enabled !== false && (
        <section className="mx-auto max-w-4xl px-4 mt-24">
          <FadeIn><VipClub /></FadeIn>
        </section>
      )}

      {/* FAQ */}
      {show("faq") && (faq.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-3xl px-4 mt-24">
          <FadeIn><SectionTitle eyebrow="יש שאלות?" title="שאלות נפוצות" /></FadeIn>
          <FadeIn><FaqAccordion items={faq.data!} /></FadeIn>
        </section>
      )}

      {/* Contact */}
      {show("contact") && (
        <section className="mx-auto max-w-3xl px-4 mt-24">
          <FadeIn><SectionTitle eyebrow="נשמח לשמוע" title="צריך עזרה לבחור? דבר איתנו עכשיו" sub="מענה אנושי ומהיר, לפני ואחרי הרכישה." /></FadeIn>
          <FadeIn><ContactChannels tg={site.telegram || ""} wa={site.whatsapp || ""} /></FadeIn>
          <FadeIn><ContactForm /></FadeIn>
        </section>
      )}
    </>
  );
}
