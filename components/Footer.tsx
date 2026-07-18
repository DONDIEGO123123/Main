import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-panel/60">
      <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-display text-3xl font-black gold-text">LUXE</p>
          <p className="mt-3 text-sm text-smoke leading-relaxed">
            מוצרי פרימיום, שירות אישי ומשלוחים מהירים בכל רחבי הארץ.
          </p>
        </div>
        <div>
          <p className="font-semibold mb-4 text-gold">ניווט</p>
          <ul className="space-y-2 text-sm text-smoke">
            <li><Link href="/products" className="hover:text-gold transition">מוצרים</Link></li>
            <li><Link href="/promotions" className="hover:text-gold transition">מבצעים</Link></li>
            <li><Link href="/delivery" className="hover:text-gold transition">אזורי משלוח</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-4 text-gold">מידע</p>
          <ul className="space-y-2 text-sm text-smoke">
            <li><Link href="/faq" className="hover:text-gold transition">שאלות נפוצות</Link></li>
            <li><Link href="/reviews" className="hover:text-gold transition">ביקורות לקוחות</Link></li>
            <li><Link href="/contact" className="hover:text-gold transition">צור קשר</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-4 text-gold">זמינים בשבילכם</p>
          <p className="text-sm text-smoke">מענה מהיר בטלגרם ובוואטסאפ, בכל שעות היום.</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-smoke">
        © {new Date().getFullYear()} LUXE — כל הזכויות שמורות
      </div>
    </footer>
  );
}
