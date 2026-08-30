"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCart, getReferral } from "@/lib/useCart";
import { useSiteSettings } from "@/lib/site";
import { useMember, awardPoints, logEvent } from "@/lib/member";
import { formatPrice } from "@/lib/utils";
import type { DeliveryArea } from "@/lib/types";

export default function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clear, count } = useCart();
  const site = useSiteSettings();
  const { member, refresh } = useMember();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", region: "", notes: "" });

  useEffect(() => {
    if (member) setForm((f) => ({ ...f, name: f.name || member.display_name, phone: f.phone || member.phone }));
  }, [member]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    createClient().from("delivery_areas").select("*").eq("is_active", true)
      .then(({ data }) => setAreas((data as DeliveryArea[]) ?? []));
  }, []);

  const area = areas.find((a) => a.region === form.region);
  const fee = area?.fee ?? 0;
  const total = subtotal + fee;

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async () => {
    setErr("");
    if (!form.name.trim() || !form.phone.trim()) { setErr("נא למלא שם וטלפון"); return; }
    if (!form.region) { setErr("נא לבחור אזור משלוח"); return; }
    if (items.length === 0) { setErr("העגלה ריקה"); return; }

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("orders").insert({
      customer_name: form.name.trim(),
      customer_phone: form.phone.trim(),
      customer_address: form.address.trim(),
      city: form.city.trim(),
      region: form.region,
      notes: form.notes.trim(),
      items,
      subtotal,
      delivery_fee: fee,
      total,
      referral_code: getReferral(),
      member_id: member?.id ?? null,
    }).select("order_number").single();

    if (error) { setErr("שמירת ההזמנה נכשלה. נסו שוב או צרו קשר בוואטסאפ."); setBusy(false); return; }

    const num = data?.order_number;

    if (member) {
      await awardPoints(member.id, "order", `הזמנה #${num}`);
      await awardPoints(member.id, "order_per_100", "בונוס לפי סכום ההזמנה", Math.floor(total / 100));
      await logEvent(member.id, "order", `הזמנה #${num} · ${formatPrice(total)}`);
      await refresh();
    }
    // WhatsApp confirmation message (opens for the customer to send)
    const lines = items.map((i) => `• ${i.name} × ${i.qty} — ${formatPrice(i.price * i.qty)}`).join("\n");
    const msg =
      `שלום! ביצעתי הזמנה מהאתר 🛍️\n\n` +
      `מס' הזמנה: ${num}\n` +
      `שם: ${form.name}\n` +
      `טלפון: ${form.phone}\n` +
      `כתובת: ${form.address}, ${form.city}\n\n` +
      `${lines}\n\n` +
      `משלוח: ${formatPrice(fee)}\n` +
      `סה״כ לתשלום: ${formatPrice(total)}` +
      (form.notes ? `\n\nהערות: ${form.notes}` : "");

    const wa = site.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_URL || "";
    const base = wa.split("?")[0];
    clear();
    if (base) window.open(`${base}?text=${encodeURIComponent(msg)}`, "_blank");
    router.push(`/order?n=${num}`);
  };

  if (count === 0) {
    return (
      <div className="glass p-10 text-center">
        <p className="text-gold/30 text-6xl mb-4">✦</p>
        <p className="text-smoke mb-6">העגלה ריקה</p>
        <Link href="/products" className="btn-gold inline-block px-8 py-3">לצפייה במוצרים</Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 glass p-6 space-y-4">
        <h2 className="font-semibold text-lg">פרטי המזמין</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-smoke block mb-1">שם מלא *</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-smoke block mb-1">טלפון *</label>
            <input className="input" dir="ltr" inputMode="tel" value={form.phone}
              onChange={(e) => set("phone", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">אזור משלוח *</label>
          <select className="input" value={form.region} onChange={(e) => set("region", e.target.value)}>
            <option value="">בחרו אזור…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.region}>
                {a.name} — {a.eta} ({a.fee > 0 ? formatPrice(a.fee) : "חינם"})
              </option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-smoke block mb-1">עיר</label>
            <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-smoke block mb-1">כתובת</label>
            <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">הערות להזמנה</label>
          <textarea className="input min-h-[90px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>

      <div className="lg:col-span-2 glass-gold p-6 h-fit space-y-4 lg:sticky lg:top-24">
        <h2 className="font-semibold text-lg">סיכום הזמנה</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((i) => (
            <div key={i.product_id} className="flex justify-between text-sm gap-2">
              <span className="truncate text-smoke">{i.name} × {i.qty}</span>
              <span className="shrink-0">{formatPrice(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-smoke">סכום ביניים</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between">
            <span className="text-smoke">משלוח</span>
            <span>{form.region ? (fee > 0 ? formatPrice(fee) : "חינם") : "—"}</span>
          </div>
          <div className="flex justify-between text-lg pt-2 border-t border-white/10">
            <span className="font-semibold">סה״כ</span>
            <span className="font-bold gold-text">{formatPrice(total)}</span>
          </div>
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button onClick={submit} disabled={busy} className="btn-gold w-full py-3 disabled:opacity-50">
          {busy ? "שולח…" : "שליחת הזמנה ←"}
        </button>
        <p className="text-smoke text-xs text-center">
          לאחר השליחה תיפתח שיחת וואטסאפ עם פרטי ההזמנה להשלמת התשלום
        </p>
      </div>
    </div>
  );
}
