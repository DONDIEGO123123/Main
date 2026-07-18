"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { useSiteSettings } from "@/lib/site";
import Hologram from "@/components/Hologram";
import type { Product } from "@/lib/types";


export default function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const site = useSiteSettings();
  const [active, setActive] = useState(0);
  const [holo, setHolo] = useState(false);
  useEffect(() => { setHolo(false); }, [product?.id]);
  useEffect(() => { setActive(0); }, [product?.id]);

  const media: { type: "image" | "video"; src: string }[] = product
    ? [
        ...(product.image_url ? [{ type: "image" as const, src: product.image_url }] : []),
        ...((product.gallery ?? []).map((src) => ({ type: "image" as const, src }))),
        ...((product.videos ?? []).map((src) => ({ type: "video" as const, src }))),
      ]
    : [];
  const current = media[active];

  const share = async () => {
    if (!product) return;
    const url = `${location.origin}/products?q=${encodeURIComponent(product.name)}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="relative glass-gold w-full md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl grid md:grid-cols-2"
          >
            <div>
              <div className="relative aspect-square bg-panel">
                {current ? (
                  current.type === "video" ? (
                    <video key={current.src} src={current.src} controls playsInline className="absolute inset-0 h-full w-full object-contain bg-black" />
                  ) : (
                    <Image key={current.src} src={current.src} alt={product.name} fill className="object-cover" sizes="50vw" />
                  )
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-gold/30 text-7xl">✦</div>
                )}
              </div>
              {media.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3 bg-black/20">
                  {media.map((m, i) => (
                    <button key={m.src + i} onClick={() => setActive(i)}
                      className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border ${i === active ? "border-gold" : "border-white/10 opacity-70"}`}>
                      {m.type === "video" ? (
                        <>
                          <video src={m.src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                          <span className="absolute inset-0 grid place-items-center text-white text-lg drop-shadow">▶</span>
                        </>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={m.src} alt="" className="h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 md:p-8 flex flex-col">
              <button onClick={onClose} aria-label="סגירה" className="self-start text-smoke hover:text-gold text-2xl leading-none">×</button>
              <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">{product.name}</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-gold text-2xl font-bold">{formatPrice(product.price)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-smoke line-through">{formatPrice(product.compare_at_price)}</span>
                )}
              </div>
              <p className="mt-4 text-smoke leading-relaxed whitespace-pre-line flex-1">
                {product.description || "פריט פרימיום מהקולקציה שלנו."}
              </p>
              <button onClick={() => setHolo(true)}
                className="mt-5 w-full rounded-xl border border-gold/50 py-2.5 text-sm text-gold hover:bg-gold/10 transition relative overflow-hidden">
                <span className="relative z-10">✦ תצוגת הולוגרמה</span>
                <span className="absolute inset-0 holo-sweep opacity-40" aria-hidden />
              </button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <a href={site.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_URL || "#"} target="_blank" rel="noopener noreferrer" className="btn-gold py-2.5 text-sm">
                  הזמנה בוואטסאפ
                </a>
                <button onClick={share} className="btn-ghost py-2.5 text-sm">שיתוף</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <Hologram product={holo ? product : null} onClose={() => setHolo(false)} />
    </>
  );
}
