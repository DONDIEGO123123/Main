"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setState("sending");
    const { error } = await createClient().from("contact_messages").insert(form);
    setState(error ? "error" : "sent");
  };

  if (state === "sent") {
    return (
      <div className="glass-gold p-10 text-center">
        <p className="text-4xl">✦</p>
        <h3 className="font-display text-2xl font-bold mt-3">ההודעה נשלחה</h3>
        <p className="text-smoke mt-2">נחזור אליכם בהקדם, בדרך כלל תוך שעות ספורות.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass p-6 md:p-8 space-y-4">
      <input
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="שם מלא"
        className="input"
      />
      <input
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        placeholder="טלפון (לא חובה)"
        className="input"
        inputMode="tel"
      />
      <textarea
        required
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="במה נוכל לעזור?"
        rows={5}
        className="input resize-none"
      />
      {state === "error" && (
        <p className="text-red-400 text-sm">השליחה נכשלה. נסו שוב או פנו אלינו ישירות בטלגרם.</p>
      )}
      <button disabled={state === "sending"} className="btn-gold w-full disabled:opacity-60">
        {state === "sending" ? "שולח…" : "שליחת הודעה"}
      </button>
    </form>
  );
}
