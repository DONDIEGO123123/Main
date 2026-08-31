"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSheet() {
  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    createClient().from("settings").select("value").eq("key", "sheet").maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as { url?: string; enabled?: boolean };
        setUrl(v.url ?? "");
        setEnabled(!!v.enabled);
        setLoaded(true);
      });
  }, []);

  const save = async () => {
    await createClient().from("settings")
      .upsert({ key: "sheet", value: { url: url.trim(), enabled } }, { onConflict: "key" });
    setMsg("✓ נשמר");
    setTimeout(() => setMsg(""), 1800);
  };

  const test = async () => {
    setMsg("שולח שורת בדיקה…");
    await save();
    const r = await fetch("/api/sheet-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_number: 0, customer_name: "בדיקה", customer_phone: "0500000000",
        city: "—", customer_address: "—",
        items: [{ name: "שורת בדיקה", qty: 1 }],
        delivery_fee: 0, total: 0, status: "test",
      }),
    });
    const j = await r.json();
    setMsg(j.ok ? "✓ נשלח! בדוק בגיליון" : "❌ נכשל — בדוק את הכתובת ואת הרשאת הגישה");
  };

  if (!loaded) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">סנכרון לגיליון</h1>
      <p className="text-smoke text-sm">
        כל הזמנה חדשה תיכנס אוטומטית כשורה בגיליון Google Sheets שלך.
      </p>

      <div className="glass p-5 space-y-4">
        <button onClick={() => setEnabled(!enabled)}
          className={`w-full py-3 rounded-xl border transition ${
            enabled ? "bg-gold/15 text-gold border-gold/40" : "border-white/15 text-smoke"
          }`}>
          {enabled ? "✓ סנכרון פעיל" : "סנכרון כבוי"}
        </button>

        <div>
          <label className="text-sm text-smoke block mb-1">כתובת אפליקציית האינטרנט</label>
          <input className="input text-xs" dir="ltr"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="btn-gold flex-1 py-3">שמירה</button>
          <button onClick={test} className="btn-ghost px-6 py-3">שליחת בדיקה</button>
        </div>
        {msg && <p className="text-sm text-gold">{msg}</p>}
      </div>

      <div className="glass p-5 text-sm text-smoke leading-relaxed space-y-1">
        <p className="font-semibold text-white mb-2">חשוב לדעת:</p>
        <p>· שם הגיליון התחתון חייב להיות <span className="text-gold">Orders</span> באנגלית</p>
        <p>· בפריסה, "למי יש גישה" חייב להיות <span className="text-gold">כל אחד</span></p>
        <p>· אחרי כל שינוי בקוד — צריך לפרוס מחדש ולעדכן כאן את הכתובת</p>
      </div>
    </div>
  );
}
