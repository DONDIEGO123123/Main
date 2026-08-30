"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSiteSettings } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function SmartSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const site = useSiteSettings();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await createClient().from("products")
        .select("*").eq("is_active", true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(8);
      setResults((data as Product[]) ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="container mx-auto px-4 pt-20 max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="glass p-4">
          <div className="flex gap-2 items-center">
            <input ref={inputRef} className="input flex-1" placeholder="חיפוש מוצר…"
              value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onClose} className="h-11 w-11 rounded-xl glass text-gold text-xl">×</button>
          </div>

          {loading && <p className="text-smoke text-sm mt-4 text-center">מחפש…</p>}

          {!loading && q.trim() && results.length === 0 && (
            <div className="mt-6 text-center py-6">
              <p className="text-smoke mb-4">לא מצאת את מה שחיפשת?</p>
              {site.whatsapp && (
                <a href={site.whatsapp} target="_blank" rel="noopener noreferrer"
                  className="btn-gold inline-block px-6 py-3">
                  דבר איתנו בוואטסאפ ←
                </a>
              )}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {results.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} onClick={onClose}
                  className="flex gap-3 glass p-3 hover:border-gold/40 transition">
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-black/30 shrink-0">
                    {p.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : <div className="h-full w-full grid place-items-center text-gold/30">✦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-gold text-sm">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
