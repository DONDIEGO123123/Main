"use client";
import { useEffect, useState, useCallback } from "react";
import type { Product } from "@/lib/types";

const KEY = "luxe-compare";
const EVT = "luxe-compare-change";
const MAX = 4;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  window.dispatchEvent(new Event(EVT));
}

/** Product comparison tray (#28). Up to four products, kept in the browser. */
export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = read();
    write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, []);

  const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { ids, toggle, remove, clear, full: ids.length >= MAX, max: MAX };
}

/** Rows for the comparison table, built only from fields we actually have. */
export function compareRows(products: Product[]) {
  return [
    { label: "מחיר", get: (p: Product) => p.price },
    { label: "מחיר לפני הנחה", get: (p: Product) => p.compare_at_price ?? null },
    { label: "זמינות", get: (p: Product) => (p.stock === 0 ? "אזל" : "במלאי") },
    { label: "מלאי", get: (p: Product) => (p.stock === null ? "—" : p.stock) },
    { label: "מוצר מוביל", get: (p: Product) => (p.is_featured ? "כן" : "—") },
    { label: "תג", get: (p: Product) => p.badge ?? "—" },
  ];
}
