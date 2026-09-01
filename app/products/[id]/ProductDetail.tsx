"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/useCart";
import { openCart } from "@/components/CartDrawer";
import { useWishlist } from "@/lib/useWishlist";
import { useSiteSettings } from "@/lib/site";
import { trackProductView } from "@/lib/track-view";
import { formatPrice } from "@/lib/utils";
import Hologram from "@/components/Hologram";
import ProductCard from "@/components/ProductCard";
import ShareButton from "@/components/ShareButton";
import HoloMedia from "@/components/HoloMedia";
import { useHolographic } from "@/lib/useHolographic";
import RecentlyViewed from "@/components/RecentlyViewed";
import type { Product } from "@/lib/types";

type Faq = { id: string; question: string; answer: string };

export default function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const site = useSiteSettings();
  const tilt = useHolographic<HTMLDivElement>();
  const [gallery, setGallery] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [holo, setHolo] = useState(false);
  const [faq, setFaq] = useState<Faq[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [added, setAdded] = useState(false);
  const [alertPhone, setAlertPhone] = useState("");
  const [alertSent, setAlertSent] = useState(false);

  const saved = ids.includes(product.id);
  const soldOut = product.stock === 0;
  const off = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;

  useEffect(() => {
    setGallery([product.image_url, ...(product.gallery ?? [])].filter(Boolean) as string[]);
    trackProductView(product.id);
    const s = createClient();
    s.from("product_faq").select("*").eq("product_id", product.id).order("sort_order")
      .then(({ data }) => setFaq((data as Faq[]) ?? []));
    if (product.category_id) {
      s.from("products").select("*").eq("category_id", product.category_id)
        .eq("is_active", true).neq("id", product.id).limit(4)
        .then(({ data }) => setRelated((data as Product[]) ?? []));
    }
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addNow = () => { add(product); setAdded(true); openCart(); setTimeout(() => setAdded(false), 1800); };

  const notifyMe = async () => {
    if (alertPhone.replace(/\D/g, "").length < 9) return;
    await createClient().from("stock_alerts").insert({ product_id: product.id, phone: alertPhone.trim() });
    setAlertSent(true);
  };

  return (
    <>
      <main className="container mx-auto px-4 py-10 max-w-6xl pb-28 lg:pb-10">
        <Link href="/products" className="text-smoke text-sm hover:text-gold transition-colors duration-base ease-luxe">← לכל המוצרים</Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mt-8">
          {/* Gallery */}
          <div>
            <div
              ref={tilt.ref}
              {...tilt.handlers}
              className="holo-card holo-hero glass overflow-hidden aspect-square relative"
            >
              <div className="holo-card__media absolute inset-0">
                <div className="holo-card__layer absolute inset-0">
                  <HoloMedia
                    src={gallery[active] ?? null}
                    video={active === 0 ? (product.videos?.[0] ?? null) : null}
                    alt={product.name}
                    className="h-full w-full"
                  />
                </div>
                <span className="holo-card__light" aria-hidden />
                <span className="holo-card__iri" aria-hidden />
                <span className="holo-card__spec" aria-hidden />
                <span className="holo-card__scan" aria-hidden />
              </div>
              {off > 0 && (
                <span className="absolute top-4 right-4 z-20 bg-gold text-ink text-sm font-bold px-3 py-1 rounded-full">
                  −{off}%
                </span>
              )}
              {product.badge && (
                <span className="absolute top-4 left-4 z-20 glass-gold text-gold text-xs px-3 py-1 rounded-full">
                  {product.badge}
                </span>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {gallery.map((g, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    aria-label={`תמונה ${i + 1}`}
                    aria-current={i === active}
                    className={`h-16 w-16 rounded-xl overflow-hidden shrink-0 border transition-all duration-base ease-luxe ${
                      i === active
                        ? "border-gold/70 shadow-glow-soft"
                        : "border-white/10 opacity-55 hover:opacity-90 hover:border-white/25"
                    }`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {gallery.length > 0 && (
              <button onClick={() => setHolo(true)} className="btn-ghost w-full mt-3 py-2.5 text-sm">
                ⤢ הגדלה למסך מלא
              </button>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-display-md font-bold leading-tight">{product.name}</h1>
              <div className="rule mt-6 w-20" aria-hidden />
              <div className="flex items-baseline gap-3 mt-6">
                <span className="font-display text-4xl md:text-5xl font-black metal-text">
                  {formatPrice(product.price)}
                </span>
                {off > 0 && (
                  <span className="text-smoke-dim line-through text-lg">
                    {formatPrice(product.compare_at_price!)}
                  </span>
                )}
              </div>
            </div>

            {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
              <p className="text-gold text-sm">
                🔥 נותרו {product.stock} במלאי
              </p>
            )}

            {product.description && (
              <p className="text-white/70 leading-loose whitespace-pre-line max-w-prose">{product.description}</p>
            )}

            {soldOut ? (
              <div className="glass p-5 space-y-3">
                <p className="font-semibold">🔔 רוצה לדעת כשהוא חוזר?</p>
                {alertSent ? (
                  <p className="text-gold text-sm">✓ נעדכן אותך ברגע שהמוצר חוזר למלאי</p>
                ) : (
                  <div className="flex gap-2">
                    <input className="input flex-1" dir="ltr" inputMode="tel" placeholder="מספר טלפון"
                      value={alertPhone} onChange={(e) => setAlertPhone(e.target.value)} />
                    <button onClick={notifyMe} className="btn-gold px-5 text-sm">עדכנו אותי</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex gap-3">
                <button onClick={addNow} className="btn-gold flex-1 py-3.5">
                  {added ? "✓ נוסף לעגלה" : "הוספה לעגלה 🛒"}
                </button>
                <ShareButton product={product} />
                <button onClick={() => toggle(product.id)} aria-label="שמירה למועדפים"
                  className={`h-[52px] w-[52px] rounded-xl glass grid place-items-center text-xl transition ${
                    saved ? "text-red-400" : "text-smoke"
                  }`}>
                  {saved ? "❤️" : "🤍"}
                </button>
              </div>
            )}

            {site.whatsapp && (
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer"
                className="glass p-4 flex items-center gap-3 hover:border-gold/40 transition-colors duration-base ease-luxe">
                <span className="text-2xl">💬</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">צריך עזרה לבחור?</p>
                  <p className="text-smoke text-xs">דבר איתנו עכשיו בוואטסאפ</p>
                </div>
                <span className="text-gold">←</span>
              </a>
            )}

            {/* Shipping / policy */}
            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {[
                ["🚚", "משלוח לכל הארץ", "דמי המשלוח מחושבים לפי אזור בעמוד התשלום"],
                ["💎", "נבדק לפני המשלוח", "כל פריט עובר בדיקה לפני שהוא יוצא"],
                ["💬", "שירות אישי", "מענה בוואטסאפ ובטלגרם, לפני ואחרי הרכישה"],
              ].map(([icon, title, body]) => (
                <div key={title} className="flex gap-4 py-4">
                  <span className="text-lg shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-sm text-smoke mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Product FAQ */}
            {faq.length > 0 && (
              <div className="glass p-5">
                <h2 className="font-semibold mb-3">❓ שאלות נפוצות</h2>
                <div className="space-y-2">
                  {faq.map((f) => (
                    <div key={f.id} className="border-b border-white/5 last:border-0 pb-2">
                      <button onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)}
                        className="w-full text-right py-2 flex gap-2 items-center">
                        <span className="flex-1 text-sm font-medium">{f.question}</span>
                        <span className="text-gold shrink-0">{openFaq === f.id ? "−" : "+"}</span>
                      </button>
                      {openFaq === f.id && (
                        <p className="text-smoke text-sm pb-2 leading-relaxed">{f.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold mb-6">👀 מוצרים שיכולים לעניין אותך</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
        <RecentlyViewed excludeId={product.id} />
      </main>

      {/* Sticky mobile add-to-cart */}
      {!soldOut && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <div className="shrink-0">
            <p className="font-display text-xl font-black gold-text leading-none">{formatPrice(product.price)}</p>
            {off > 0 && <p className="text-smoke text-xs line-through">{formatPrice(product.compare_at_price!)}</p>}
          </div>
          <button onClick={addNow} className="btn-gold flex-1 py-3">
            {added ? "✓ נוסף" : "הוספה לעגלה 🛒"}
          </button>
        </div>
      )}

      <Hologram product={holo ? product : null} onClose={() => setHolo(false)} />
    </>
  );
}
