"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QrCode from "@/components/QrCode";
import type { Product } from "@/lib/types";

export default function AdminQr() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pid, setPid] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    createClient().from("products").select("*").eq("is_active", true).order("name")
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  const url = pid ? `${origin}/products/${pid}` : origin;
  const selected = products.find((p) => p.id === pid);

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-display text-3xl font-bold">קוד QR</h1>
      <p className="text-smoke text-sm">
        להדפסה על שלט, כרטיס ביקור או אריזה. סריקה פותחת את הדף ישירות.
      </p>

      <div className="glass p-5 space-y-4">
        <div>
          <label className="text-sm text-smoke block mb-1">יעד</label>
          <select className="input" value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">דף הבית של החנות</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="text-center py-4">
          {origin && <QrCode value={url} size={220} />}
          <p className="text-smoke text-xs mt-3 font-mono break-all" dir="ltr">{url}</p>
          {selected && <p className="text-gold text-sm mt-1">{selected.name}</p>}
        </div>

        <p className="text-smoke text-xs text-center">
          לשמירה: לחיצה ארוכה על הקוד (בנייד) או קליק ימני → שמירת תמונה
        </p>
      </div>
    </div>
  );
}
