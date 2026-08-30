"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Public review submission — saved unapproved, awaits admin approval. */
export default function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: "", rating: 5, content: "" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.author.trim() || !form.content.trim()) return;
    setBusy(true);
    await createClient().from("reviews").insert({ ...form, is_approved: false });
    setBusy(false); setDone(true);
  };

  if (done) return <p className="text-center text-gold mt-6">תודה! הביקורת התקבלה ותפורסם לאחר אישור. ✓</p>;

  return (
    <div className="text-center mt-8">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-ghost">✍️ השאירו ביקורת</button>
      ) : (
        <div className="glass p-6 max-w-md mx-auto text-right space-y-3">
          <input className="input" placeholder="שם" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          <div className="flex items-center gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setForm({ ...form, rating: n })}
                className={`text-3xl ${n <= form.rating ? "text-gold" : "text-white/20"}`}>★</button>
            ))}
          </div>
          <textarea className="input min-h-24" placeholder="הביקורת שלך" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <button onClick={submit} disabled={busy} className="btn-gold w-full">{busy ? "שולח…" : "שליחה"}</button>
        </div>
      )}
    </div>
  );
}
