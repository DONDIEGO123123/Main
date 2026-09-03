"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Cfg = { enabled?: boolean; bot_token?: string; chat_id?: string; cart_alerts?: boolean };

export default function AdminNotifications() {
  const [cfg, setCfg] = useState<Cfg>({});
  const [testing, setTesting] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    createClient().from("settings").select("value").eq("key", "notify").maybeSingle()
      .then(({ data }) => { setCfg((data?.value ?? {}) as Cfg); setLoaded(true); });
  }, []);

  const save = async () => {
    await createClient().from("settings").upsert({ key: "notify", value: cfg }, { onConflict: "key" });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const test = async () => {
    setTestMsg("שולח…");
    await save();
    const r = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "✅ בדיקה: ההתראות מחוברות בהצלחה" }),
    });
    const j = await r.json();
    setTestMsg(j.ok ? "✓ נשלח! בדוק בטלגרם" : "❌ השליחה נכשלה — בדוק את הפרטים");
  };

  if (!loaded) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">התראות בטלגרם</h1>
      <p className="text-smoke text-sm">
        קבל הודעה בטלגרם ברגע שמתקבלת הזמנה חדשה.
      </p>

      <div className="glass p-5 space-y-4">
        <button onClick={() => setCfg({ ...cfg, enabled: !cfg.enabled })}
          className={`w-full py-3 rounded-xl border transition ${
            cfg.enabled ? "bg-gold/15 text-gold border-gold/40" : "border-white/15 text-smoke"
          }`}>
          {cfg.enabled ? "✓ התראות פעילות" : "התראות כבויות"}
        </button>

        <button
          onClick={async () => {
            setTesting("שולח…");
            try {
              const r = await fetch("/api/cart-alert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ test: true }),
              });
              const d = await r.json();
              setTesting(d.ok ? "✓ נשלחה הודעת בדיקה לטלגרם" : `✕ ${d.reason ?? "נכשל"}`);
            } catch {
              setTesting("✕ הבקשה נכשלה");
            }
          }}
          className="w-full py-3 rounded-xl border border-gold/40 text-gold"
        >
          שליחת הודעת בדיקה
        </button>
        {testing && <p className="text-sm text-smoke text-center">{testing}</p>}

        <button onClick={() => setCfg({ ...cfg, cart_alerts: cfg.cart_alerts === false })}
          className={`w-full py-3 rounded-xl border transition ${
            cfg.cart_alerts === false
              ? "border-white/15 text-smoke"
              : "bg-gold/15 text-gold border-gold/40"
          }`}>
          {cfg.cart_alerts === false ? "התראות עגלה נטושה כבויות" : "✓ התראה על עגלה נטושה"}
        </button>

        <div>
          <label className="text-sm text-smoke block mb-1">Bot Token</label>
          <input className="input" dir="ltr" placeholder="123456:ABC-DEF..."
            value={cfg.bot_token ?? ""} onChange={(e) => setCfg({ ...cfg, bot_token: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">Chat ID</label>
          <input className="input" dir="ltr" placeholder="123456789"
            value={cfg.chat_id ?? ""} onChange={(e) => setCfg({ ...cfg, chat_id: e.target.value })} />
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="btn-gold flex-1 py-3">
            {saved ? "✓ נשמר" : "שמירה"}
          </button>
          <button onClick={test} className="btn-ghost px-6 py-3">שליחת בדיקה</button>
        </div>
        {testMsg && <p className="text-sm text-gold">{testMsg}</p>}
      </div>

      <div className="glass p-5 text-sm text-smoke leading-relaxed space-y-2">
        <p className="font-semibold text-white">איך משיגים את הפרטים:</p>
        <p>1. בטלגרם, חפש <span className="text-gold">@BotFather</span> ושלח <span className="text-gold" dir="ltr">/newbot</span></p>
        <p>2. תן שם לבוט — תקבל <span className="text-gold">Bot Token</span>, העתק לכאן</p>
        <p>3. שלח הודעה כלשהי לבוט החדש שיצרת</p>
        <p>4. חפש <span className="text-gold">@userinfobot</span> ושלח לו הודעה — הוא יחזיר את ה־<span className="text-gold">Chat ID</span> שלך</p>
        <p>5. הדבק כאן, שמור, ולחץ "שליחת בדיקה"</p>
      </div>
    </div>
  );
}
