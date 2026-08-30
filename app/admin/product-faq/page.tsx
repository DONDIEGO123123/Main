"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

type Faq = { id: string; product_id: string; question: string; answer: string; sort_order: number };

export default function AdminProductFaq() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pid, setPid] = useState("");
  const [faq, setFaq] = useState<Faq[]>([]);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient().from("products").select("*").order("name")
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  useEffect(() => {
    if (!pid) { setFaq([]); return; }
    createClient().from("product_faq").select("*").eq("product_id", pid).order("sort_order")
      .then(({ data }) => setFaq((data as Faq[]) ?? []));
  }, [pid]);

  const addFaq = async () => {
    if (!pid || !q.trim() || !a.trim()) return;
    setBusy(true);
    const { data } = await createClient().from("product_faq")
      .insert({ product_id: pid, question: q.trim(), answer: a.trim(), sort_order: faq.length })
      .select("*").single();
    if (data) setFaq([...faq, data as Faq]);
    setQ(""); setA(""); setBusy(false);
  };

  const del = async (id: string) => {
    await createClient().from("product_faq").delete().eq("id", id);
    setFaq(faq.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">שאלות נפוצות למוצר</h1>

      <div className="glass p-5 space-y-4">
        <div>
          <label className="text-sm text-smoke block mb-1">בחר מוצר</label>
          <select className="input" value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">בחר…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {pid && (
          <>
            <div>
              <label className="text-sm text-smoke block mb-1">שאלה</label>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-smoke block mb-1">תשובה</label>
              <textarea className="input min-h-[80px]" value={a} onChange={(e) => setA(e.target.value)} />
            </div>
            <button onClick={addFaq} disabled={busy} className="btn-gold px-6 py-2.5 text-sm disabled:opacity-50">
              הוספה
            </button>
          </>
        )}
      </div>

      {faq.length > 0 && (
        <div className="space-y-2">
          {faq.map((f) => (
            <div key={f.id} className="glass p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{f.question}</p>
                  <p className="text-smoke text-sm mt-1">{f.answer}</p>
                </div>
                <button onClick={() => del(f.id)} className="text-red-400 text-sm shrink-0">מחיקה</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
