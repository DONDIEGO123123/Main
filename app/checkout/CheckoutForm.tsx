"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCart, getReferral } from "@/lib/useCart";
import { useSiteSettings } from "@/lib/site";
import { useLang } from "@/lib/i18n";
import { useMember, awardPoints, logEvent } from "@/lib/member";
import { formatPrice } from "@/lib/utils";
import CouponBox from "@/components/CouponBox";
import CheckoutUpsell from "@/components/CheckoutUpsell";
import { consumeCoupon, type Coupon } from "@/lib/coupon";
import { notifyOwner } from "@/lib/notify";
import { markRecovered, saveAbandonedCart } from "@/lib/abandoned";
import { getChannel } from "@/lib/channel";
import { syncToSheet } from "@/lib/sheet";
import { track } from "@/lib/events";
import type { DeliveryArea } from "@/lib/types";

export default function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clear, count, setQty, remove } = useCart();
  const site = useSiteSettings();
  const { t } = useLang();
  const { member, refresh } = useMember();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", region: "", notes: "" });

  useEffect(() => {
    if (member) setForm((f) => ({ ...f, name: f.name || member.display_name, phone: f.phone || member.phone }));
  }, [member]);

  // A phone typed here is our only way to follow up if the customer stops.
  // Debounced so we save once they pause, not on every keystroke.
  useEffect(() => {
    const digits = form.phone.replace(/\D/g, "");
    const t = setTimeout(() => {
      saveAbandonedCart(
        items, subtotal,
        digits.length >= 9 ? form.phone : undefined,
        member?.id,
        "checkout"
      );
    }, 900);
    return () => clearTimeout(t);
  }, [items, subtotal, form.phone, member?.id]);

  useEffect(() => {
    if (items.length > 0) track({ name: "checkout_started", memberId: member?.id });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    createClient().from("delivery_areas").select("*").eq("is_active", true)
      .then(({ data }) => setAreas((data as DeliveryArea[]) ?? []));
  }, []);

  const area = areas.find((a) => a.region === form.region);
  const fee = area?.fee ?? 0;
  const total = Math.max(0, subtotal + fee - discount);

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
      coupon_code: coupon?.code ?? null,
      discount,
      member_id: member?.id ?? null,
      channel: getChannel(),
    }).select("order_number").single();

    if (error) {
      // surface the real cause — a generic message once hid a missing column
      console.error("[checkout] order insert failed:", error);
      setErr(`שמירת ההזמנה נכשלה: ${error.message}`);
      setBusy(false);
      return;
    }

    const num = data?.order_number;

    track({
      name: "order_created", memberId: member?.id, entityType: "order", entityId: String(num),
      metadata: { total, items: items.length, region: form.region, coupon: coupon?.code ?? null },
    });
    if (coupon) await consumeCoupon(coupon.id, coupon.used_count);
    await markRecovered();

    syncToSheet({
      order_number: num,
      customer_name: form.name,
      customer_phone: form.phone,
      city: form.city,
      customer_address: form.address,
      items,
      delivery_fee: fee,
      total,
      status: "new",
    });

    notifyOwner(
      `🛍️ <b>הזמנה חדשה #${num}</b>\n\n` +
      `👤 ${form.name}\n📞 ${form.phone}\n📍 ${form.region}\n\n` +
      items.map((i) => `• ${i.name} × ${i.qty}`).join("\n") +
      `\n\n💰 סה״כ: ${formatPrice(total)}`
    );

    if (member) {
      await awardPoints(member.id, "order", `הזמנה #${num}`, 1, `order-${num}`);
      await awardPoints(member.id, "order_per_100", "בונוס לפי סכום ההזמנה", Math.floor(total / 100), `order-bonus-${num}`);
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
        <p className="text-smoke mb-6">{t("emptyCart")}</p>
        <Link href="/products" className="btn-gold inline-block px-8 py-3">{t("allProducts")}</Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 glass p-6 space-y-5">
        {/* Phone leads: it is how we reach the customer if they stop here */}
        <div>
          <label className="font-semibold text-lg block mb-1">{t("phone")}</label>
          <p className="text-smoke text-sm mb-3">
            נשתמש בו כדי לאשר את ההזמנה ולעדכן על המשלוח
          </p>
          <input
            className="input text-lg py-4"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="050-0000000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>

        <div className="rule" aria-hidden />

        <h2 className="font-semibold text-lg">פרטי המשלוח</h2>
        <div>
          <label className="text-sm text-smoke block mb-1">{t("fullName")}</label>
          <input className="input" autoComplete="name" value={form.name}
            onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">{t("region")}</label>
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
            <label className="text-sm text-smoke block mb-1">{t("city")}</label>
            <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-smoke block mb-1">{t("address")}</label>
            <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">{t("notes")}</label>
          <textarea className="input min-h-[90px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>

      <div className="lg:col-span-2 glass-gold p-6 h-fit space-y-4 lg:sticky lg:top-24">
        <h2 className="font-semibold text-lg">{t("orderSummary")}</h2>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {items.map((i) => (
            <div key={i.product_id} className="flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="truncate">{i.name}</p>
                <p className="text-smoke text-xs">{formatPrice(i.price)} ליחידה</p>
              </div>

              {/* quantities are editable here — no need to go back to the cart */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setQty(i.product_id, i.qty - 1)}
                  aria-label="הפחתת כמות"
                  className="h-7 w-7 rounded-full border border-white/15 text-smoke
                             transition-colors duration-base ease-luxe hover:border-gold/50 hover:text-gold"
                >
                  −
                </button>
                <span className="w-6 text-center tabular-nums">{i.qty}</span>
                <button
                  onClick={() => setQty(i.product_id, i.qty + 1)}
                  aria-label="הוספת כמות"
                  className="h-7 w-7 rounded-full border border-white/15 text-smoke
                             transition-colors duration-base ease-luxe hover:border-gold/50 hover:text-gold"
                >
                  +
                </button>
              </div>

              <span className="shrink-0 w-16 text-left tabular-nums">
                {formatPrice(i.price * i.qty)}
              </span>

              <button
                onClick={() => remove(i.product_id)}
                aria-label={`הסרת ${i.name}`}
                className="text-smoke text-lg leading-none shrink-0 transition-colors hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <Link href="/products" className="btn-ghost block text-center py-2 text-sm">
          הוספת מוצרים נוספים
        </Link>
        <CheckoutUpsell />

        <div className="border-t border-white/10 pt-4">
          <CouponBox subtotal={subtotal} memberLevel={member?.level} onApply={(c, d) => { setCoupon(c); setDiscount(d); }} />
        </div>

        <div className="border-t border-white/10 pt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-smoke">{t("subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between">
            <span className="text-smoke">{t("shipping")}</span>
            <span>{form.region ? (fee > 0 ? formatPrice(fee) : t("free")) : "—"}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-gold">
              <span>הנחת קופון</span><span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg pt-2 border-t border-white/10">
            <span className="font-semibold">{t("total")}</span>
            <span className="font-bold gold-text">{formatPrice(total)}</span>
          </div>
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button onClick={submit} disabled={busy} className="btn-gold w-full py-3 disabled:opacity-50">
          {busy ? t("sending") : `${t("sendOrder")} ←`}
        </button>
        <p className="text-smoke text-xs text-center">
          לאחר השליחה תיפתח שיחת וואטסאפ עם פרטי ההזמנה להשלמת התשלום
        </p>
      </div>
    </div>
  );
}
