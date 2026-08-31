"use client";
import Link from "next/link";
import { useSiteSettings } from "@/lib/site";

export default function Footer() {
  const site = useSiteSettings();
  return (
    <footer className="relative mt-32">
      <div className="rule" aria-hidden />
      <div className="bg-ink-deep/60">
      <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-display text-3xl font-black metal-text tracking-[0.14em]">{site.name || "LUXE"}</p>
          <p className="mt-3 text-sm text-smoke leading-relaxed">
            מוצרי פרימיום, שירות אישי ומשלוחים מהירים בכל רחבי הארץ.
          </p>
        </div>
        <div>
          <p className="font-semibold mb-4 text-white/90">ניווט</p>
          <ul className="space-y-2 text-sm text-smoke">
            <li><Link href="/products" className="transition-colors duration-base ease-luxe hover:text-gold">מוצרים</Link></li>
            <li><Link href="/promotions" className="transition-colors duration-base ease-luxe hover:text-gold">מבצעים</Link></li>
            <li><Link href="/delivery" className="transition-colors duration-base ease-luxe hover:text-gold">אזורי משלוח</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-4 text-white/90">מידע</p>
          <ul className="space-y-2 text-sm text-smoke">
            <li><Link href="/faq" className="transition-colors duration-base ease-luxe hover:text-gold">שאלות נפוצות</Link></li>
            <li><Link href="/reviews" className="transition-colors duration-base ease-luxe hover:text-gold">ביקורות לקוחות</Link></li>
            <li><Link href="/contact" className="transition-colors duration-base ease-luxe hover:text-gold">צור קשר</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-4 text-white/90">זמינים בשבילכם</p>
          <p className="text-sm text-smoke">מענה מהיר בטלגרם ובוואטסאפ, בכל שעות היום.</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-smoke">
        © {new Date().getFullYear()} {site.name || "LUXE"} — כל הזכויות שמורות
      </div>
      </div>
    </footer>
  );
}
