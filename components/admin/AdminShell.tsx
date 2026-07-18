"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/admin/dashboard", label: "לוח בקרה", icon: "◆" },
  { href: "/admin/products", label: "מוצרים", icon: "▣" },
  { href: "/admin/categories", label: "קטגוריות", icon: "☰" },
  { href: "/admin/promotions", label: "מבצעים", icon: "%" },
  { href: "/admin/banners", label: "באנרים", icon: "▭" },
  { href: "/admin/reviews", label: "ביקורות", icon: "★" },
  { href: "/admin/faq", label: "שאלות נפוצות", icon: "?" },
  { href: "/admin/delivery", label: "אזורי משלוח", icon: "➤" },
  { href: "/admin/settings", label: "הגדרות אתר", icon: "⚙" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const Menu = (
    <nav className="space-y-1">
      {nav.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
            pathname === n.href ? "bg-gold/15 text-gold border border-gold/30" : "text-white/75 hover:bg-white/5"
          }`}
        >
          <span className="text-gold w-5 text-center">{n.icon}</span>
          {n.label}
        </Link>
      ))}
      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/10 transition">
        <span className="w-5 text-center">⎋</span> התנתקות
      </button>
    </nav>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 grid lg:grid-cols-[240px_1fr] gap-6">
      {/* Mobile bar */}
      <div className="lg:hidden glass p-3 flex items-center justify-between">
        <p className="font-display font-black gold-text text-xl">ניהול LUXE</p>
        <button onClick={() => setOpen((v) => !v)} className="btn-ghost py-1.5 px-4 text-sm">תפריט</button>
      </div>
      {open && <div className="lg:hidden glass p-3">{Menu}</div>}

      <aside className="hidden lg:block">
        <div className="glass p-4 sticky top-24">
          <p className="font-display font-black gold-text text-2xl px-3 pb-4">ניהול LUXE</p>
          {Menu}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
