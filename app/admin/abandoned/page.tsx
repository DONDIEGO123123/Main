"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

type Cart = {
  stage?: string;
  alerted_at?: string | null;
  member_id?: string | null;
  id: string; session_id: string; phone: string | null;
  items: CartItem[]; total: number; recovered: boolean; updated_at: string;
};

export default function AdminAbandoned() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string>>({});

  useEffect(() => {
    createClient().from("abandoned_carts").select("*")
      .eq("recovered", false).order("updated_at", { ascending: false }).limit(100)
      .then(({ data }) => { setCarts((data as Cart[]) ?? []); setLoading(false); });
  }, []);

  const del = async (id: string) => {
    await createClient().from("abandoned_carts").delete().eq("id", id);
    setCarts(carts.filter((c) => c.id !== id));
  };

  const sendAlert = async (c: Cart) => {
    setSending(c.id);
    try {
      // clear the stamp so a manual retry is always allowed
      await createClient().from("abandoned_carts")
        .update({ alerted_at: null }).eq("id", c.id);

      const r = await fetch("/api/cart-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: c.session_id }),
      });
      const d = await r.json();
      setResult((p) => ({
        ...p,
        [c.id]: d.ok ? "✓ נשלח לטלגרם" : `✕ ${d.reason ?? "נכשל"}`,
      }));
    } catch {
      setResult((p) => ({ ...p, [c.id]: "✕ הבקשה נכשלה" }));
    }
    setSending(null);
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const withPhone = carts.filter((c) => c.phone);
  const potential = carts.reduce((n, c) => n + Number(c.total), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">עגלות נטושות</h1>
      <p className="text-smoke text-sm">
        לקוחות שהוסיפו מוצרים ולא השלימו הזמנה. מי שהשאיר טלפון — שווה פנייה.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-5 text-center">
          <p className="font-display text-2xl font-black text-gold tabular-nums">{carts.length}</p>
          <p className="text-smoke text-sm mt-1">עגלות פתוחות</p>
        </div>
        <div className="glass-gold p-5 text-center">
          <p className="font-display text-2xl font-black gold-text tabular-nums">{withPhone.length}</p>
          <p className="text-smoke text-sm mt-1">עם טלפון</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="font-display text-2xl font-black text-gold tabular-nums">{formatPrice(potential)}</p>
          <p className="text-smoke text-sm mt-1">פוטנציאל</p>
        </div>
      </div>

      {carts.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">אין עגלות נטושות</div>
      ) : (
        <div className="space-y-3">
          {carts.map((c) => (
            <div key={c.id} className="glass p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    {c.phone ? <span dir="ltr">{c.phone}</span> : <span className="text-smoke">ללא טלפון</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                      c.stage === "checkout"
                        ? "border-orange-400/40 bg-orange-500/15 text-orange-300"
                        : "border-white/15 text-smoke"
                    }`}>
                      {c.stage === "checkout" ? "עזב בתשלום" : "עזב בעגלה"}
                    </span>
                  </p>
                  <p className="text-smoke text-xs mt-0.5">
                    {new Date(c.updated_at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {(c.items ?? []).map((i, idx) => (
                      <p key={idx} className="text-smoke text-xs truncate">• {i.name} × {i.qty}</p>
                    ))}
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-gold font-bold">{formatPrice(Number(c.total))}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {c.phone && (
                  <a
                    href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "972")}?text=${
                      encodeURIComponent(
                        `היי! ראינו שהשארת מוצרים בעגלה 🛍️\nרוצה שנשלים את ההזמנה?\n\n` +
                        (c.items ?? []).map((i) => `• ${i.name} × ${i.qty}`).join("\n") +
                        `\n\nסה״כ: ${formatPrice(Number(c.total))}`
                      )
                    }`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-gold px-4 py-2 text-sm"
                  >
                    פנייה בוואטסאפ
                  </a>
                )}

                <button
                  onClick={() => sendAlert(c)}
                  disabled={sending === c.id}
                  className="btn-ghost px-4 py-2 text-sm disabled:opacity-50"
                >
                  {sending === c.id ? "שולח…" : "שלח לי לטלגרם"}
                </button>

                {result[c.id] && (
                  <span className={`text-xs ${
                    result[c.id].startsWith("✓") ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {result[c.id]}
                  </span>
                )}

                <button onClick={() => del(c.id)} className="mr-auto text-smoke text-sm hover:text-red-400">
                  הסרה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
