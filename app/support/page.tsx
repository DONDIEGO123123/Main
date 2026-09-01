"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import { useSiteSettings } from "@/lib/site";
import { timeAgo } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Ticket = {
  id: string; ticket_number: number; subject: string;
  status: string; created_at: string;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  new:         { label: "נפתחה",    cls: "bg-gold/20 text-gold border-gold/40" },
  open:        { label: "בטיפול",   cls: "bg-blue-500/20 text-blue-300 border-blue-400/40" },
  in_progress: { label: "מטופלת",   cls: "bg-purple-500/20 text-purple-300 border-purple-400/40" },
  resolved:    { label: "נסגרה",    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
};

/** Support centre (#56): open a ticket, follow its status. */
export default function SupportPage() {
  const { member } = useMember();
  const site = useSiteSettings();
  const [form, setForm] = useState({ name: "", phone: "", subject: "", message: "" });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!member) return;
    setForm((f) => ({ ...f, name: f.name || member.display_name, phone: f.phone || member.phone }));
    createClient().from("support_tickets")
      .select("id,ticket_number,subject,status,created_at")
      .eq("phone", member.phone).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setTickets((data as Ticket[]) ?? []));
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setErr("");
    if (!form.phone.trim() || !form.subject.trim() || !form.message.trim()) {
      setErr("נא למלא טלפון, נושא ותוכן"); return;
    }
    setBusy(true);
    const { error } = await createClient().from("support_tickets").insert({
      member_id: member?.id ?? null,
      phone: form.phone.trim(),
      name: form.name.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setBusy(false);
    if (error) { setErr("השליחה נכשלה, נסו שוב"); return; }
    setSent(true);
    setForm({ ...form, subject: "", message: "" });
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-lg space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-2">🆘</p>
        <h1 className="font-display text-2xl font-bold gold-text">מרכז התמיכה</h1>
        <p className="text-smoke text-sm mt-2">נשמח לעזור — נחזור אליכם בהקדם</p>
      </div>

      {site.whatsapp && (
        <a href={site.whatsapp} target="_blank" rel="noopener noreferrer"
          className="glass p-4 flex items-center gap-3 hover:border-gold/40 transition-colors duration-base ease-luxe">
          <span className="text-2xl">💬</span>
          <div className="flex-1">
            <p className="font-semibold text-sm">צריך תשובה מהירה?</p>
            <p className="text-smoke text-xs">דברו איתנו בוואטסאפ</p>
          </div>
          <span className="text-gold">←</span>
        </a>
      )}

      {sent ? (
        <div className="glass-gold p-6 text-center">
          <p className="text-3xl mb-2">✓</p>
          <p className="font-semibold">הפנייה נשלחה</p>
          <p className="text-smoke text-sm mt-1">נחזור אליכם בהקדם</p>
          <button onClick={() => setSent(false)} className="btn-ghost mt-4 px-6 py-2 text-sm">
            פנייה נוספת
          </button>
        </div>
      ) : (
        <div className="glass p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-smoke block mb-1">שם</label>
              <input className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-smoke block mb-1">טלפון *</label>
              <input className="input" dir="ltr" inputMode="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm text-smoke block mb-1">נושא *</label>
            <input className="input" value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-smoke block mb-1">במה נוכל לעזור? *</label>
            <textarea className="input min-h-[110px]" value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button onClick={submit} disabled={busy} className="btn-gold w-full py-3 disabled:opacity-50">
            {busy ? "שולח…" : "שליחת פנייה ←"}
          </button>
        </div>
      )}

      {tickets.length > 0 && (
        <section className="glass p-5">
          <h2 className="font-semibold mb-3">הפניות שלי</h2>
          <div className="space-y-2">
            {tickets.map((t) => {
              const st = STATUS[t.status] ?? STATUS.new;
              return (
                <div key={t.id} className="flex items-center gap-3 border-b border-white/5 last:border-0 pb-2 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">#{t.ticket_number} · {t.subject}</p>
                    <p className="text-smoke text-[11px]">{timeAgo(t.created_at)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Link href="/faq" className="btn-ghost block text-center py-3">שאלות נפוצות</Link>
    </main>
  );
}
