import { createClient } from "@/lib/supabase/server";
import BarChart from "@/components/admin/BarChart";
import OnlineNow from "@/components/admin/OnlineNow";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [products, categories, reviews, promos, messages, byCat, latest, visits, visitsToday, tgClicks, waClicks] = await Promise.all([
    supabase.from("products").select("id, views", { count: "exact" }),
    supabase.from("categories").select("id, name"),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("promotions").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }),
    supabase.from("products").select("category_id"),
    supabase.from("products").select("name, updated_at").order("updated_at", { ascending: false }).limit(5),
    supabase.from("site_visits").select("id", { count: "exact", head: true }),
    supabase.from("site_visits").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    supabase.from("click_events").select("id", { count: "exact", head: true }).eq("kind", "telegram"),
    supabase.from("click_events").select("id", { count: "exact", head: true }).eq("kind", "whatsapp"),
  ]);

  const totalViews = (products.data ?? []).reduce((s, p) => s + (p.views ?? 0), 0);
  const catCounts = (categories.data ?? []).map((c) => ({
    label: c.name,
    value: (byCat.data ?? []).filter((p) => p.category_id === c.id).length,
  })).sort((a, b) => b.value - a.value);

  const stats = [
    { label: "כניסות לאתר", value: visits.count ?? 0 },
    { label: "כניסות היום", value: visitsToday.count ?? 0 },
    { label: "מוצרים", value: products.count ?? 0 },
    { label: "צפיות במוצרים", value: totalViews },
    { label: "ביקורות", value: reviews.count ?? 0 },
    { label: "מבצעים פעילים", value: promos.count ?? 0 },
    { label: "פניות מלקוחות", value: messages.count ?? 0 },
  ];
  const clicks = [
    { label: "לחיצות טלגרם", value: tgClicks.count ?? 0 },
    { label: "לחיצות וואטסאפ", value: waClicks.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">לוח בקרה</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OnlineNow />
        {stats.map((s) => (
          <div key={s.label} className="glass-gold p-5 text-center">
            <p className="font-display text-3xl font-black gold-text tabular-nums">
              {s.value.toLocaleString("he-IL")}
            </p>
            <p className="text-smoke text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {clicks.map((c) => (
          <div key={c.label} className="glass p-5 text-center">
            <p className="font-display text-2xl font-black text-gold tabular-nums">{c.value.toLocaleString("he-IL")}</p>
            <p className="text-smoke text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <BarChart title="מוצרים לפי קטגוריה" data={catCounts} />
        <div className="glass p-6">
          <p className="font-semibold mb-5">עדכונים אחרונים</p>
          <ul className="space-y-3">
            {(latest.data ?? []).map((p) => (
              <li key={p.name + p.updated_at} className="flex justify-between text-sm border-b border-white/5 pb-3">
                <span>{p.name}</span>
                <span className="text-smoke">{new Date(p.updated_at).toLocaleDateString("he-IL")}</span>
              </li>
            ))}
            {!latest.data?.length && <p className="text-smoke text-sm">עוד לא נוספו מוצרים.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
