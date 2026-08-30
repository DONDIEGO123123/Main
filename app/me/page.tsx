"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import { useCart } from "@/lib/useCart";
import { formatPrice } from "@/lib/utils";
import Challenges from "@/components/Challenges";
import ProfileStats from "@/components/ProfileStats";
import MysteryBox from "@/components/MysteryBox";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

type Level = { key: string; name: string; min_points: number; discount_percent: number; perks: string };
type Ev = { id: number; kind: string; label: string; points_delta: number; created_at: string };

export default function MePage() {
  const router = useRouter();
  const { member, ready, refresh, logout } = useMember();
  const { add } = useCart();
  const [levels, setLevels] = useState<Level[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (ready && !member) router.replace("/join"); }, [ready, member, router]);

  useEffect(() => {
    if (!member) return;
    refresh();
    const s = createClient();
    s.from("levels").select("*").order("min_points").then(({ data }) => setLevels((data as Level[]) ?? []));
    s.from("orders").select("*").eq("customer_phone", member.phone)
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setOrders((data as Order[]) ?? []));
    s.from("member_events").select("*").eq("member_id", member.id)
      .order("created_at", { ascending: false }).limit(12)
      .then(({ data }) => setEvents((data as Ev[]) ?? []));
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !member) return <div className="h-96 grid place-items-center text-smoke">טוען…</div>;

  const cur = levels.find((l) => l.key === member.level);
  const next = levels.find((l) => l.min_points > member.points);
  const progress = next
    ? Math.min(100, Math.round(((member.points - (cur?.min_points ?? 0)) / (next.min_points - (cur?.min_points ?? 0))) * 100))
    : 100;

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${member.referral_code}` : "";

  const share = async () => {
    const text = `היי! בוא תראה את החנות הזאת 👇\n${link}`;
    if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
      {/* Header */}
      <div className="glass-gold p-6 text-center">
        <p className="text-smoke text-sm">שלום,</p>
        <h1 className="font-display text-2xl font-bold gold-text">{member.display_name}</h1>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-4 py-1.5">
          <span className="text-gold text-sm font-semibold">{cur?.name ?? "Member"}</span>
          {cur?.discount_percent ? <span className="text-smoke text-xs">· {cur.discount_percent}% הנחה</span> : null}
        </div>
        <p className="font-display text-4xl font-black gold-text mt-4 tabular-nums">{member.points}</p>
        <p className="text-smoke text-sm">נקודות</p>

        {next && (
          <div className="mt-5">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gold transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-smoke text-xs mt-2">
              עוד {next.min_points - member.points} נקודות ל־{next.name}
            </p>
          </div>
        )}
        {(member.reputation ?? 0) > 0 && (
          <p className="text-smoke text-xs mt-3">
            מוניטין: <span className="text-gold">{member.reputation}</span>
            {member.rep_level && ` · ${member.rep_level}`}
          </p>
        )}
        {cur?.perks && <p className="text-smoke text-xs mt-4">{cur.perks}</p>}
      </div>

      <MysteryBox trigger="welcome" title="יש לך הפתעה" subtitle="מתנת הצטרפות — לחצו לפתיחה" />

      <Link href="/wallet" className="glass p-5 flex items-center gap-4 hover:border-gold/40 transition">
        <span className="text-2xl">💳</span>
        <div className="flex-1">
          <p className="font-semibold">הארנק שלי</p>
          <p className="text-smoke text-sm">נקודות, קופונים והיסטוריה מלאה</p>
        </div>
        <span className="text-gold">←</span>
      </Link>

      <Link href="/rewards" className="glass-gold p-5 flex items-center gap-4 hover:border-gold/40 transition">
        <span className="text-2xl">🎁</span>
        <div className="flex-1">
          <p className="font-semibold">מרכז ההטבות</p>
          <p className="text-smoke text-sm">מימוש נקודות בקופונים והטבות</p>
        </div>
        <span className="text-gold">←</span>
      </Link>

      <ProfileStats />

      <Challenges />

      {/* Referral */}
      <div className="glass p-6">
        <h2 className="font-semibold mb-1">👥 חבר מביא חבר</h2>
        <p className="text-smoke text-sm mb-4">שתפו את הקישור — כשחבר מצטרף ומזמין, אתם מרוויחים נקודות.</p>
        <div className="flex items-center gap-2 glass px-3 py-2.5 mb-3">
          <span className="text-gold font-mono text-sm truncate flex-1" dir="ltr">{link}</span>
        </div>
        <button onClick={share} className="btn-gold w-full py-3">
          {copied ? "✓ הקישור הועתק" : "שיתוף הקישור שלי ←"}
        </button>
      </div>

      {/* Orders */}
      <div className="glass p-6">
        <h2 className="font-semibold mb-4">🛍 ההזמנות שלי</h2>
        {orders.length === 0 ? (
          <p className="text-smoke text-sm">עדיין אין הזמנות</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-semibold">#{o.order_number}</p>
                  <p className="text-smoke text-xs">
                    {new Date(o.created_at).toLocaleDateString("he-IL")} · {(o.items ?? []).length} פריטים
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gold font-bold">{formatPrice(Number(o.total))}</span>
                  <button
                    onClick={() => (o.items ?? []).forEach((i) => add(
                      { id: i.product_id, name: i.name, price: i.price, image_url: i.image_url } as never, i.qty
                    ))}
                    className="btn-ghost px-3 py-1.5 text-xs shrink-0">
                    🔄 הזמן שוב
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass p-6">
        <h2 className="font-semibold mb-4">📜 הפעילות שלי</h2>
        {events.length === 0 ? (
          <p className="text-smoke text-sm">אין פעילות עדיין</p>
        ) : (
          <div className="space-y-2.5">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-smoke text-xs tabular-nums shrink-0">
                  {new Date(e.created_at).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
                </span>
                <span className="flex-1 truncate">{e.label}</span>
                {e.points_delta !== 0 && (
                  <span className="text-gold text-xs font-semibold shrink-0">+{e.points_delta}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/products" className="btn-gold flex-1 py-3 text-center">להמשך קנייה</Link>
        <button onClick={() => { logout(); router.push("/"); }} className="btn-ghost px-6 py-3">יציאה</button>
      </div>
    </main>
  );
}
