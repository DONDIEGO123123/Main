"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/notifications";

type Item = {
  id: number; kind: string; title: string; body: string;
  icon: string; link: string | null; image_url: string | null;
  is_pinned: boolean; created_at: string;
};

/**
 * Community feed (#3). Shows shop-wide events only — new products,
 * rewards, announcements. No personal data about any member.
 */
export default function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    createClient().from("feed_items").select("*")
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => setItems((data as Item[]) ?? []));
  }, [limit]);

  if (items.length === 0) return null;

  return (
    <section className="glass p-6">
      <h2 className="font-semibold mb-4">📰 מה חדש</h2>
      <div className="space-y-3">
        {items.map((it) => {
          const inner = (
            <div className="flex gap-3 items-start">
              {it.image_url ? (
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-black/30 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
              ) : (
                <span className="text-xl shrink-0">{it.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {it.is_pinned && <span className="text-gold mr-1">📌</span>}
                  {it.title}
                </p>
                {it.body && <p className="text-smoke text-xs mt-0.5 truncate">{it.body}</p>}
                <p className="text-smoke text-[11px] mt-1">{timeAgo(it.created_at)}</p>
              </div>
            </div>
          );

          return it.link ? (
            <Link key={it.id} href={it.link}
              className="block border-b border-white/5 last:border-0 pb-3 last:pb-0 hover:opacity-80 transition">
              {inner}
            </Link>
          ) : (
            <div key={it.id} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
