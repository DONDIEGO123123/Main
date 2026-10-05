"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string; title: string; body: string;
  sent_count: number; failed_count: number; created_at: string;
};

type Product = { id: string; name: string; created_at: string };

/** Compose and broadcast a push notification to every registered device. */
export default function AdminPush() {
  const [devices, setDevices] = useState(0);
  const [history, setHistory] = useState<Campaign[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/products");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const s = createClient();
    const [d, h, p] = await Promise.all([
      s.from("push_subscriptions").select("id", { count: "exact", head: true }).lt("failed_count", 5),
      s.from("push_campaigns").select("*").order("created_at", { ascending: false }).limit(10),
      s.from("products").select("id,name,created_at").eq("is_active", true)
        .order("created_at", { ascending: false }).limit(5),
    ]);
    setDevices(d.count ?? 0);
    setHistory((h.data as Campaign[]) ?? []);
    setRecent((p.data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const send = async (test = false) => {
    if (!title.trim()) { setResult("✕ נא למלא כותרת"); return; }
    if (!test && !confirm(`לשלוח התראה ל-${devices} מכשירים?`)) return;

    setBusy(true);
    setResult("");
    try {
      const r = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, link, test }),
      });
      const d = await r.json();
      setResult(
        d.ok
          ? `✓ נשלח ל-${d.sent} מכשירים${d.removed ? ` · ${d.removed} הוסרו` : ""}`
          : `✕ ${d.reason ?? "השליחה נכשלה"}`
      );
      if (d.ok && !test) { setTitle(""); setBody(""); load(); }
    } catch {
      setResult("✕ הבקשה נכשלה");
    }
    setBusy(false);
  };

  /** One tap to announce the newest product. */
  const fillFromProduct = (p: Product) => {
    setTitle("מוצר חדש בחנות ✨");
    setBody(p.name);
    setLink(`/products/${p.id}`);
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">התראות לטלפון</h1>

      <div className="glass-gold p-6 text-center">
        <p className="font-display text-3xl font-black gold-text tabular-nums">{devices}</p>
        <p className="text-smoke text-sm mt-1">מכשירים רשומים</p>
      </div>

      {/* one tap to announce something new */}
      {recent.length > 0 && (
        <section className="glass p-5">
          <h2 className="font-semibold mb-3">הכרזה על מוצר חדש</h2>
          <div className="space-y-2">
            {recent.map((p) => (
              <button key={p.id} onClick={() => fillFromProduct(p)}
                className="w-full flex items-center gap-3 text-right p-3 rounded-xl
                           transition-colors duration-base ease-luxe hover:bg-white/[0.04]">
                <span className="flex-1 min-w-0 text-sm truncate">{p.name}</span>
                <span className="text-smoke text-xs shrink-0">{timeAgo(p.created_at)}</span>
                <span className="text-gold text-sm shrink-0">מילוי ←</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* the message */}
      <section className="glass p-5 space-y-4">
        <div>
          <label className="text-sm text-smoke block mb-1">כותרת *</label>
          <input className="input" maxLength={60} value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="מוצר חדש בחנות ✨" />
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">תוכן</label>
          <input className="input" maxLength={120} value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="שרשרת זהב 18 קראט — עכשיו במלאי" />
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">לאן מוביל הלחיצה</label>
          <input className="input" dir="ltr" value={link}
            onChange={(e) => setLink(e.target.value)} placeholder="/products" />
        </div>

        {/* what it will look like on the phone */}
        <div className="border-t border-white/10 pt-4">
          <p className="text-smoke text-xs mb-2">כך זה ייראה:</p>
          <div className="glass-thin p-3 flex gap-3 items-start">
            <div className="h-9 w-9 rounded-lg bg-ink-deep border border-gold/30
                            grid place-items-center text-gold shrink-0" aria-hidden>✦</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{title || "כותרת ההתראה"}</p>
              <p className="text-smoke text-xs truncate">{body || "תוכן ההתראה"}</p>
            </div>
          </div>
        </div>

        {result && (
          <p className={`text-sm ${result.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
            {result}
          </p>
        )}

        <div className="flex gap-2">
          <button onClick={() => send(true)} disabled={busy}
            className="btn-ghost flex-1 py-3 text-sm disabled:opacity-50">
            בדיקה למכשיר אחד
          </button>
          <button onClick={() => send(false)} disabled={busy || devices === 0}
            className="btn-gold flex-1 py-3 disabled:opacity-40">
            {busy ? "שולח…" : `שליחה ל-${devices}`}
          </button>
        </div>
      </section>

      {/* what was sent before */}
      {history.length > 0 && (
        <section className="glass p-5">
          <h2 className="font-semibold mb-3">שליחות אחרונות</h2>
          <div className="space-y-2">
            {history.map((c) => (
              <div key={c.id}
                className="flex items-center gap-3 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="truncate">{c.title}</p>
                  <p className="text-smoke text-[11px]">{timeAgo(c.created_at)}</p>
                </div>
                <span className="text-gold tabular-nums shrink-0">{c.sent_count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-smoke text-xs leading-relaxed">
        התראות מגיעות למי שאישר אותן. באייפון נדרש שהלקוח יוסיף את האתר
        למסך הבית — האתר מציג לו בקשה לכך מעצמו.
      </p>
    </div>
  );
}
