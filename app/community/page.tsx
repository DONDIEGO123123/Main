"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import { useSiteSettings } from "@/lib/site";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import Challenges from "@/components/Challenges";
import Leaderboard from "@/components/Leaderboard";
import ActivityFeed from "@/components/ActivityFeed";

export const dynamic = "force-dynamic";

type Level = { key: string; name: string; min_points: number; discount_percent: number; perks: string };
type Reward = { id: string; title: string; points_cost: number };

export default function CommunityPage() {
  const { member } = useMember();
  const site = useSiteSettings();
  const [levels, setLevels] = useState<Level[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [fresh, setFresh] = useState<Product[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const s = createClient();
    s.from("levels").select("*").order("min_points").then(({ data }) => setLevels((data as Level[]) ?? []));
    s.from("rewards").select("id,title,points_cost").eq("is_active", true).order("points_cost").limit(4)
      .then(({ data }) => setRewards((data as Reward[]) ?? []));
    s.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(4)
      .then(({ data }) => setFresh((data as Product[]) ?? []));
    s.from("members").select("id", { count: "exact", head: true })
      .then(({ count }) => setCount(count ?? 0));
  }, []);

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="text-center">
        <p className="text-4xl mb-2">🔥</p>
        <h1 className="font-display text-3xl font-bold gold-text">הקהילה</h1>
        {count > 0 && <p className="text-smoke mt-2">{count} חברים כבר איתנו</p>}
      </div>

      {!member ? (
        <div className="glass-gold p-8 text-center">
          <h2 className="font-display text-xl font-bold">עוד לא הצטרפת?</h2>
          <p className="text-smoke mt-2">נקודות, רמות VIP והטבות בלעדיות — הרשמה עם טלפון בלבד.</p>
          <Link href="/join" className="btn-gold inline-block mt-5 px-8 py-3">הצטרפות חינם ←</Link>
        </div>
      ) : (
        <Link href="/me" className="glass-gold p-6 flex items-center gap-4 hover:border-gold/40 transition">
          <span className="text-3xl">💎</span>
          <div className="flex-1">
            <p className="font-semibold">{member.display_name}</p>
            <p className="text-smoke text-sm">{member.points} נקודות · {member.level}</p>
          </div>
          <span className="text-gold">←</span>
        </Link>
      )}

      <ActivityFeed />

      <Challenges />

      <Leaderboard />

      {/* Levels */}
      {levels.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">🏆 רמות הקהילה</h2>
          <div className="space-y-2">
            {levels.map((l) => (
              <div key={l.key} className={`glass p-4 flex items-center gap-4 ${
                member?.level === l.key ? "border-gold/50" : ""
              }`}>
                <div className="flex-1">
                  <p className="font-semibold">{l.name}
                    {member?.level === l.key && <span className="text-gold text-xs mr-2">· הרמה שלך</span>}
                  </p>
                  {l.perks && <p className="text-smoke text-sm mt-0.5">{l.perks}</p>}
                </div>
                <span className="text-gold text-sm tabular-nums shrink-0">{l.min_points}+</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rewards preview */}
      {rewards.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">🎁 הטבות למימוש</h2>
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((r) => (
              <div key={r.id} className="glass p-4">
                <p className="font-semibold text-sm">{r.title}</p>
                <p className="text-gold text-sm mt-1 tabular-nums">{r.points_cost} נקודות</p>
              </div>
            ))}
          </div>
          <Link href="/rewards" className="btn-ghost block text-center py-3 mt-3">למרכז ההטבות ←</Link>
        </section>
      )}

      {/* New products */}
      {fresh.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">🆕 חדש בחנות</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {fresh.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Channels */}
      <section className="grid sm:grid-cols-2 gap-3">
        {site.telegram && (
          <a href={site.telegram} target="_blank" rel="noopener noreferrer"
            className="glass p-5 flex items-center gap-3 hover:border-gold/40 transition">
            <span className="text-2xl">📢</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">ערוץ הטלגרם</p>
              <p className="text-smoke text-xs">מבצעים לפני כולם</p>
            </div>
          </a>
        )}
        {site.whatsapp && (
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer"
            className="glass p-5 flex items-center gap-3 hover:border-gold/40 transition">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">וואטסאפ</p>
              <p className="text-smoke text-xs">שירות אישי</p>
            </div>
          </a>
        )}
      </section>
    </main>
  );
}
