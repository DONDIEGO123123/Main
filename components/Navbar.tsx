"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

const links = [
  { href: "/", label: "בית" },
  { href: "/products", label: "מוצרים", mega: true },
  { href: "/promotions", label: "מבצעים" },
  { href: "/delivery", label: "משלוחים" },
  { href: "/reviews", label: "ביקורות" },
  { href: "/faq", label: "שאלות" },
  { href: "/contact", label: "צור קשר" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-ink/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-2xl md:text-3xl font-black gold-text">
          LUXE
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
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  pathname === l.href ? "text-gold" : "text-white/80 hover:text-gold"
                }`}
              >
                {l.label}
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
                      <div className="glass-gold p-4 grid gap-1">
                        <p className="text-xs text-smoke px-3 pb-2 tracking-widest">קטגוריות</p>
                        {cats.map((c) => (
                          <Link
                            key={c.id}
                            href={`/products?category=${c.slug}`}
                            className="px-3 py-2 rounded-lg text-sm hover:bg-gold/10 hover:text-gold transition"
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
          <button
            aria-label="חיפוש"
            onClick={() => setSearchOpen((v) => !v)}
            className="h-10 w-10 grid place-items-center rounded-full border border-white/10 hover:border-gold/50 hover:text-gold transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </button>
          <button
            aria-label="תפריט"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden h-10 w-10 grid place-items-center rounded-full border border-white/10"
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-gold transition ${open ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-5 bg-gold transition ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-gold transition ${open ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Global search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.form
            onSubmit={submitSearch}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/5 bg-ink/90 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-3xl px-4 py-4 flex gap-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש מוצרים…"
                className="input"
              />
              <button className="btn-gold py-2 px-6">חפש</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

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
                    {l.label}
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
