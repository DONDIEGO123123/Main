"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import SmartSearch from "@/components/SmartSearch";
import LangSwitch from "@/components/LangSwitch";
import NotificationBell from "@/components/NotificationBell";
import { useLang } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

const links = [
  { href: "/", label: "בית", k: "home" },
  { href: "/products", label: "מוצרים", mega: true, k: "products" },
  { href: "/promotions", label: "מבצעים", k: "promotions" },
  { href: "/delivery", label: "משלוחים", k: "delivery" },
  { href: "/reviews", label: "ביקורות", k: "reviews" },
  { href: "/faq", label: "שאלות", k: "faq" },
  { href: "/contact", label: "צור קשר", k: "contact" },
  { href: "/community", label: "קהילה", k: "community" },
  { href: "/support", label: "תמיכה" },
  { href: "/orders", label: "מעקב הזמנה", k: "myOrders" },
];

export default function Navbar() {
  const { t } = useLang();
  const site = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    createClient()
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCats(data ?? []));
  }, []);

  useEffect(() => {
    setOpen(false);
    setMega(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-slow ease-luxe ${
        scrolled ? "pt-2 md:pt-3" : "pt-0"
      }`}
    >
      <nav
        className={`mx-auto flex items-center justify-between gap-4 transition-all duration-slow ease-luxe ${
          scrolled
            ? "max-w-6xl mx-4 md:mx-auto h-14 md:h-16 px-4 md:px-6 rounded-full glass-raised"
            : "max-w-7xl px-4 h-16 md:h-20 border-b border-transparent"
        }`}
      >
        <Link
          href="/"
          className={`font-display font-black metal-text tracking-[0.14em] transition-all duration-slow ease-luxe ${
            scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
          }`}
        >
          {site.name || "LUXE"}
        </Link>

        {/* Desktop */}
        <ul className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <li
              key={l.href}
              onMouseEnter={() => l.mega && setMega(true)}
              onMouseLeave={() => l.mega && setMega(false)}
              className="relative"
            >
              <Link
                href={l.href}
                className={`group/link relative px-3.5 py-2 text-sm transition-colors duration-base ease-luxe ${
                  pathname === l.href ? "text-gold" : "text-white/75 hover:text-white"
                }`}
              >
                {l.k ? t(l.k) : l.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-right scale-x-0
                              bg-gradient-to-l from-transparent via-gold to-transparent
                              transition-transform duration-base ease-luxe
                              group-hover/link:scale-x-100 ${
                                pathname === l.href ? "scale-x-100" : ""
                              }`}
                />
              </Link>
              {l.mega && (
                <AnimatePresence>
                  {mega && cats.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full right-0 pt-3 w-72"
                    >
                      <div className="glass-raised p-4 grid gap-1">
                        <p className="text-xs text-smoke px-3 pb-2">קטגוריות</p>
                        <div className="rule mb-1" aria-hidden />
                        {cats.map((c) => (
                          <Link
                            key={c.id}
                            href={`/products?category=${c.slug}`}
                            className="px-3 py-2 rounded-lg text-sm hover:bg-gold/10 hover:text-gold transition-colors duration-base ease-luxe"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <LangSwitch />
          <button
            aria-label="חיפוש"
            onClick={() => setSearchOpen((v) => !v)}
            className="h-10 w-10 grid place-items-center rounded-full border border-white/10 text-white/80 transition-colors duration-base ease-luxe hover:border-gold/50 hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </button>
          <button
            aria-label="תפריט"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden h-10 w-10 grid place-items-center rounded-full border border-white/10 transition-colors duration-base ease-luxe hover:border-gold/50"
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-gold transition ${open ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-5 bg-gold transition ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-gold transition ${open ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Global search — live results */}
      <SmartSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden bg-ink/95 backdrop-blur-xl border-b border-white/5"
          >
            <ul className="px-4 py-4 space-y-1">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={l.href}
                    className={`block px-4 py-3 rounded-xl ${
                      pathname === l.href ? "bg-gold/10 text-gold" : "hover:bg-white/5"
                    }`}
                  >
                    {l.k ? t(l.k) : l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
