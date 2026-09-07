"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { timeAgo } from "@/lib/notifications";
import type { CartItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type Cart = {
  id: string;
  phone: string;
  member_id: string | null;
  name?: string;
  items: CartItem[];
  total: number;
  stage: string | null;
  updated_at: string;
  contacted_at: string | null;
};

const DEFAULT_MSG = `היי {שם}! ראינו שהשארת מוצרים בעגלה 🛍️
רוצה שנשלים את ההזמנה?`;

/**
 * One screen for every cart that has a phone number.
 *
 * WhatsApp has no bulk-send from the browser, so the workflow is: write the
 * message once, then one tap per customer. Each link opens WhatsApp with the
 * message and that customer's own products already filled in.
 */
export default function CartBlast() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(DEFAULT_MSG);
  const [includeItems, setIncludeItems] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await createClient()
      .from("abandoned_carts")
      .select("id,phone,member_id,items,total,stage,updated_at,contacted_at")
      .eq("recovered", false)
      .not("phone", "is", null)
      .order("updated_at", { ascending: false })
      .limit(300);
    const rows = (data as Cart[]) ?? [];

    // a name makes the message personal — members have one on file
    const ids = rows.map((r) => r.member_id).filter(Boolean) as string[];
    if (ids.length) {
      const { data: members } = await createClient()
        .from("members").select("id,display_name").in("id", ids);
      const byId = new Map(
        ((members ?? []) as { id: string; display_name: string }[])
          .map((m) => [m.id, m.display_name])
      );
      rows.forEach((r) => { if (r.member_id) r.name = byId.get(r.member_id); });
    }

    setCarts(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const shown = useMemo(
    () => (filter === "pending" ? carts.filter((c) => !c.contacted_at) : carts),
    [carts, filter]
  );

  const pending = carts.filter((c) => !c.contacted_at).length;

  /** Build this customer's message from the template. */
  const buildMessage = (c: Cart) => {
    let body = c.name
      ? msg.replace(/\{שם\}/g, c.name)
      : msg.replace(/\s*\{שם\}/g, "");

    if (includeItems && c.items?.length) {
      const lines = c.items.map((i) => `• ${i.name} × ${i.qty}`).join("\n");
      body += `\n\n${lines}\n\nסה״כ: ${formatPrice(Number(c.total))}`;
    }
    return body;
  };

  const waLink = (c: Cart) => {
    const digits = c.phone.replace(/\D/g, "").replace(/^0/, "972");
    return `https://wa.me/${digits}?text=${encodeURIComponent(buildMessage(c))}`;
  };

  /** Mark as contacted so the list shrinks as you work through it. */
  const markContacted = async (c: Cart) => {
    setBusy(c.id);
    const now = new Date().toISOString();
    setCarts((p) => p.map((x) => (x.id === c.id ? { ...x, contacted_at: now } : x)));
    await createClient().from("abandoned_carts")
      .update({ contacted_at: now }).eq("id", c.id);
    setBusy(null);
  };

  const openAndMark = (c: Cart) => {
    window.open(waLink(c), "_blank", "noopener");
    markContacted(c);
  };

  const resetAll = async () => {
    if (!confirm("לאפס את הסימון על כל העגלות?")) return;
    await createClient().from("abandoned_carts")
      .update({ contacted_at: null }).eq("recovered", false);
    load();
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">פנייה לעגלות נטושות</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 text-center">
          <p className="font-display text-2xl font-black text-gold tabular-nums">{carts.length}</p>
          <p className="text-smoke text-sm mt-1">עגלות עם טלפון</p>
        </div>
        <div className="glass-gold p-5 text-center">
          <p className="font-display text-2xl font-black gold-text tabular-nums">{pending}</p>
          <p className="text-smoke text-sm mt-1">ממתינות לפנייה</p>
        </div>
      </div>

      {/* the message, written once */}
      <section className="glass p-5 space-y-4">
        <div>
          <label className="font-semibold block mb-1">ההודעה</label>
          <p className="text-smoke text-sm mb-3">
            נכתבת פעם אחת ומשמשת לכל הלקוחות.
          </p>
          <textarea
            className="input min-h-[110px]"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIncludeItems((v) => !v)}
          className="flex items-center gap-3 text-sm"
        >
          <span className={`w-11 h-6 rounded-full transition relative shrink-0 ${
            includeItems ? "bg-gold" : "bg-white/15"
          }`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-ink transition-all ${
              includeItems ? "right-1" : "right-6"
            }`} />
          </span>
          <span>לצרף את המוצרים והסכום של כל לקוח</span>
        </button>

        {carts[0] && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-smoke text-xs mb-2">תצוגה מקדימה:</p>
            <div className="glass-thin p-4 text-sm whitespace-pre-line leading-relaxed">
              {buildMessage(carts[0])}
            </div>
          </div>
        )}
      </section>

      {/* the list */}
      <div className="flex items-center gap-2">
        {([["pending", `ממתינות (${pending})`], ["all", `הכל (${carts.length})`]] as const)
          .map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                filter === k ? "bg-gold text-ink border-gold font-semibold" : "border-white/15 text-smoke"
              }`}>
              {label}
            </button>
          ))}
        <button onClick={resetAll} className="mr-auto text-smoke text-sm hover:text-gold transition">
          איפוס סימונים
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-4xl mb-3" aria-hidden>✓</p>
          <p className="text-smoke">
            {filter === "pending" ? "פנית לכל העגלות" : "אין עגלות עם טלפון"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((c) => (
            <div key={c.id} className={`glass p-4 flex items-center gap-3 ${
              c.contacted_at ? "opacity-55" : ""
            }`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {c.name && <span>{c.name} · </span>}
                  <span dir="ltr">{c.phone}</span>
                </p>
                <p className="text-smoke text-xs mt-0.5 truncate">
                  {(c.items ?? []).map((i) => `${i.name} ×${i.qty}`).join(" · ")}
                </p>
                <p className="text-smoke text-[11px] mt-0.5">
                  {timeAgo(c.updated_at)}
                  {c.stage === "checkout" && " · עזב בתשלום"}
                  {c.contacted_at && ` · נשלח ${timeAgo(c.contacted_at)}`}
                </p>
              </div>

              <span className="text-gold font-bold shrink-0 tabular-nums">
                {formatPrice(Number(c.total))}
              </span>

              <button
                onClick={() => openAndMark(c)}
                disabled={busy === c.id}
                className={`px-4 py-2 text-sm shrink-0 rounded-full disabled:opacity-50 ${
                  c.contacted_at ? "btn-ghost" : "btn-gold"
                }`}
              >
                {c.contacted_at ? "שליחה שוב" : "שליחה"}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-smoke text-xs leading-relaxed">
        וואטסאפ אינו מאפשר שליחה מרובה מהדפדפן, ולכן כל לחיצה פותחת שיחה אחת
        עם ההודעה כבר מוכנה. לחצו על &laquo;שלח&raquo; בוואטסאפ כדי לשלוח.
      </p>
    </div>
  );
}
