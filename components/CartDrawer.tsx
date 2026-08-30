"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/useCart";
import { useLang } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import CrossSell from "@/components/CrossSell";
import CartProgress from "@/components/CartProgress";

const OPEN_EVT = "luxe-cart-open";
/** Open the cart drawer from anywhere (e.g. after "add to cart"). */
export function openCart() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVT));
}
export const CART_OPEN_EVENT = OPEN_EVT;

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, subtotal, count } = useCart();
  const { t } = useLang();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="fixed top-0 bottom-0 left-0 z-[71] w-[88vw] max-w-md bg-panel border-l border-gold/20 flex flex-col"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-display text-xl font-bold gold-text">{t("cart")}</h2>
              <button onClick={onClose} aria-label="סגירה"
                className="h-9 w-9 rounded-full glass text-gold text-xl leading-none">×</button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 grid place-items-center text-center px-8">
                <div>
                  <p className="text-gold/30 text-6xl mb-4">✦</p>
                  <p className="text-smoke">{t("emptyCart")}</p>
                  <Link href="/products" onClick={onClose} className="btn-gold inline-block mt-5 px-6 py-2.5">
                    {t("allProducts")}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {items.map((i) => (
                    <div key={i.product_id} className="flex gap-3 glass p-3">
                      <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-black/30">
                        {i.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-gold/30 text-2xl">✦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{i.name}</p>
                        <p className="text-gold text-sm mt-0.5">{formatPrice(i.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => setQty(i.product_id, i.qty - 1)}
                            className="h-8 w-8 rounded-lg glass text-gold text-lg leading-none">−</button>
                          <span className="w-8 text-center tabular-nums">{i.qty}</span>
                          <button onClick={() => setQty(i.product_id, i.qty + 1)}
                            className="h-8 w-8 rounded-lg glass text-gold text-lg leading-none">+</button>
                          <button onClick={() => remove(i.product_id)}
                            className="mr-auto text-smoke text-xs hover:text-red-400 transition">{t("remove")}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <CartProgress subtotal={subtotal} />

                <CrossSell />

                <div className="border-t border-white/10 p-5 space-y-4">
                  <div className="flex justify-between text-lg">
                    <span className="text-smoke">{t("total")} ({count} {t("items")})</span>
                    <span className="font-bold gold-text">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-smoke text-xs">דמי משלוח יחושבו בשלב הבא לפי אזור</p>
                  <Link href="/checkout" onClick={onClose} className="btn-gold block text-center py-3">
                    {t("checkout")} ←
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
