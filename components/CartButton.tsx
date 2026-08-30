"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/useCart";
import CartDrawer, { CART_OPEN_EVENT } from "./CartDrawer";

/** Floating cart button with live item count. Hidden when the cart is empty. */
export default function CartButton() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener(CART_OPEN_EVENT, openIt);
    return () => window.removeEventListener(CART_OPEN_EVENT, openIt);
  }, []);

  return (
    <>
      {count > 0 && (
        <button onClick={() => setOpen(true)} aria-label="פתיחת עגלה"
          className="fixed bottom-5 left-20 z-50 h-12 px-4 rounded-full glass-gold text-gold flex items-center gap-2 shadow-glow">
          <span className="text-lg">🛒</span>
          <span className="font-bold tabular-nums">{count}</span>
        </button>
      )}
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
