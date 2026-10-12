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
  // per-row outcome, keyed by cart id
  const [result, setResult] = useState<Record<string, string>>({});

  // push to abandoned carts — reaches anyone who allowed notifications,
  // including carts abandoned before notifications existed
  const [reachable, setReachable] = useState(0);
  const [pushTitle, setPushTitle] = useState("השארת מוצרים בעגלה 🛍️");
  const [pushBody, setPushBody] = useState("");
  const [cooldown, setCooldown] = useState(3);
  const [pushResult, setPushResult] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

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

    // how many open carts have a device we can actually reach
    const { data: t } = await createClient()
      .from("cart_push_targets").select("cart_id").limit(3000);
    setReachable(new Set(((t ?? []) as { cart_id: string }[]).map((x) => x.cart_id)).size);

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

  const sendPush = async (test = false) => {
    if (!test && !confirm(`לשלוח התראה לכל בעלי העגלות הפתוחות?`)) return;
    setPushBusy(true);
    setPushResult("");
    try {
      const r = await fetch("/api/push/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle, body: pushBody,
          cooldownDays: test ? 0 : cooldown, test,
        }),
      });
      const d = await r.json();
      setPushResult(
        d.ok ? `✓ נשלח ל-${d.sent} מכשירים` : `✕ ${d.reason ?? "השליחה נכשלה"}`
      );
    } catch {
      setPushResult("✕ הבקשה נכשלה");
    }
    setPushBusy(false);
  };

  /** Nudge one specific cart owner, if their device is linked. */
  const pushOne = async (c: Cart) => {
    setBusy(c.id);
    try {
      const r = await fetch("/api/push/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: c.id, title: pushTitle, body: pushBody, cooldownDays: 0,
        }),
      });
      const d = await r.json();
      setResult((p) => ({
        ...p,
        [c.id]: d.ok ? "✓ התראה נשלחה" : `✕ ${d.reason ?? "נכשל"}`,
      }));
    } catch {
      setResult((p) => ({ ...p, [c.id]: "✕ הבקשה נכשלה" }));
    }
    setBusy(null);
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

      {/* push: reaches carts the phone list cannot, including old ones */}
      <section className="glass p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden>🔔</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">התראה לטלפון</h2>
            <p className="text-smoke text-sm mt-1 leading-relaxed">
              נשלחת בבת אחת לכל מי שאישר התראות ויש לו עגלה פתוחה —
              כולל עגלות שננטשו בעבר, וגם כאלה שאין להן טלפון
              ולכן אינן מופיעות ברשימה למטה.
            </p>
          </div>
          <div className="text-center shrink-0">
            <p className="font-display text-2xl font-black gold-text tabular-nums">
              {reachable}
            </p>
            <p className="text-smoke text-[11px]">ניתנות להתראה</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-smoke block mb-1">כותרת</label>
          <input className="input" maxLength={60} value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-smoke block mb-1">
            תוכן (ריק = המוצרים והסכום של כל לקוח)
          </label>
          <input className="input" maxLength={120} value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
            placeholder="המוצרים שלך עדיין מחכים" />
        </div>

        <div>
          <label className="text-sm text-smoke block mb-1">
            לא לשלוח שוב למי שקיבל ב-{cooldown} הימים האחרונים
          </label>
          <input type="range" min={0} max={14} value={cooldown}
            onChange={(e) => setCooldown(Number(e.target.value))}
            className="w-full accent-gold" />
        </div>

        {pushResult && (
          <p className={`text-sm ${
            pushResult.startsWith("✓") ? "text-emerald-400" : "text-red-400"
          }`}>
            {pushResult}
          </p>
        )}

        <div className="flex gap-2">
          <button onClick={() => sendPush(true)} disabled={pushBusy}
            className="btn-ghost flex-1 py-3 text-sm disabled:opacity-50">
            בדיקה למכשיר אחד
          </button>
          <button onClick={() => sendPush(false)} disabled={pushBusy || reachable === 0}
            className="btn-gold flex-1 py-3 disabled:opacity-40">
            {pushBusy ? "שולח…" : "שליחה לכולם"}
          </button>
        </div>
      </section>

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

              {result[c.id] && (
                <span className={`text-xs shrink-0 ${
                  result[c.id].startsWith("✓") ? "text-emerald-400" : "text-red-400"
                }`}>
                  {result[c.id]}
                </span>
              )}

              {/* notification first — it costs nothing and needs no reply */}
              <button
                onClick={() => pushOne(c)}
                disabled={busy === c.id}
                title="התראה לטלפון"
                aria-label="שליחת התראה לטלפון"
                className="h-9 w-9 grid place-items-center rounded-full border border-white/15
                           text-smoke shrink-0 transition-colors duration-base ease-luxe
                           hover:border-gold/50 hover:text-gold disabled:opacity-40"
              >
                🔔
              </button>

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
