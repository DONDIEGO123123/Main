"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = { id: string; status: string; template: string; is_active: boolean };

const LABELS: Record<string, string> = {
  confirmed: "אושרה",
  shipped: "נשלחה",
  delivered: "נמסרה",
};

export default function AdminMessages() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    createClient().from("status_messages").select("*").order("status")
      .then(({ data }) => { setMsgs((data as Msg[]) ?? []); setLoading(false); });
  }, []);

  const save = async (m: Msg) => {
    await createClient().from("status_messages")
      .update({ template: m.template, is_active: m.is_active }).eq("id", m.id);
    setSaved(m.id);
    setTimeout(() => setSaved(""), 1600);
  };

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">הודעות ללקוח</h1>
      <p className="text-smoke text-sm">
        כשתשנה סטטוס של הזמנה, תקבל כפתור לשליחת ההודעה הזו בוואטסאפ.
      </p>

      <div className="glass p-4 text-sm text-smoke">
        <p className="font-semibold text-white mb-2">משתנים זמינים:</p>
        <p><span className="text-gold font-mono">{"{name}"}</span> — שם הלקוח</p>
        <p><span className="text-gold font-mono">{"{order}"}</span> — מספר ההזמנה</p>
        <p><span className="text-gold font-mono">{"{tracking}"}</span> — מספר מעקב וחברת שליחויות</p>
      </div>

      {msgs.map((m, i) => (
        <div key={m.id} className="glass p-5 space-y-3">
          <div className="flex items-center gap-3">
            <p className="font-semibold flex-1">כשההזמנה {LABELS[m.status] ?? m.status}</p>
            <button
              onClick={() => setMsgs(msgs.map((x, j) => j === i ? { ...x, is_active: !x.is_active } : x))}
              className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                m.is_active ? "bg-gold/15 text-gold border-gold/40" : "border-white/15 text-smoke"
              }`}>
              {m.is_active ? "פעיל" : "כבוי"}
            </button>
          </div>
          <textarea className="input min-h-[80px]" value={m.template}
            onChange={(e) => setMsgs(msgs.map((x, j) => j === i ? { ...x, template: e.target.value } : x))} />
          <button onClick={() => save(m)} className="btn-gold px-5 py-2 text-sm">
            {saved === m.id ? "✓ נשמר" : "שמירה"}
          </button>
        </div>
      ))}
    </div>
  );
}
