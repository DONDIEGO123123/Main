"use client";
import { useEffect, useState, useCallback } from "react";
import type { CartItem, Product } from "@/lib/types";
import { track } from "@/lib/events";

const KEY = "luxe-cart";
const EVT = "luxe-cart-change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVT));
}

/** Cart backed by localStorage, synced across all components via a custom event. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const add = useCallback((p: Product, qty = 1) => {
    const items = read();
    if (items.length === 0) track({ name: "cart_created", entityType: "product", entityId: p.id });
    const found = items.find((i) => i.product_id === p.id);
    if (found) found.qty += qty;
    else items.push({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url, qty });
    write(items);
  }, []);

  const setQty = useCallback((product_id: string, qty: number) => {
    let items = read();
    if (qty <= 0) items = items.filter((i) => i.product_id !== product_id);
    else items = items.map((i) => (i.product_id === product_id ? { ...i, qty } : i));
    write(items);
  }, []);

  const remove = useCallback((product_id: string) => {
    write(read().filter((i) => i.product_id !== product_id));
  }, []);

  const clear = useCallback(() => write([]), []);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);

  return { items, add, setQty, remove, clear, count, subtotal };
}

/** Read the referral code captured from the URL (?ref=CODE), if any. */
export function getReferral(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("luxe-ref");
}
