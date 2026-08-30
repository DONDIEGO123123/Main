"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import { loadMetrics, syncProgress, syncBadges, touchStreak, type Metrics } from "@/lib/progress";
import { formatPrice } from "@/lib/utils";

type Ach = { key: string; title: string; description: string; icon: string; metric: string; threshold: number; reward_points: number };
type Badge = { key: string; label: string; icon: string; description: string };
type Milestone = { id: string; title: string; spend_target: number; reward_label: string };

/**
 * Achievements, badges, streak and milestones — all computed from real
 * activity. Unlocking happens through the server, so nothing here can be faked.
 */
export default function ProfileStats() {
  const { member, refresh } = useMember();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [achievements, setAchievements] = useState<Ach[]>([]);
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<Set<string>>(new Set());
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [toast, setToast] = useState<{ title: string; icon: string; points: number } | null>(null);

  useEffect(() => {
    if (!member) return;
    (async () => {
      const s = createClient();

      // one streak tick per visit — the database enforces one per day
      await touchStreak(member.id);
      await refresh();

      const { data: fresh } = await s.from("members").select("*").eq("id", member.id).single();
      const m = await loadMetrics({ ...member, ...(fresh ?? {}) });
      setMetrics(m);

      const newly = await syncProgress(member.id, m);
      await syncBadges(member.id, m,
        (fresh?.level as string) ?? "member", (fresh?.rep_level as string) ?? "new");

      if (newly.length > 0) {
        setToast(newly[0]);
        setTimeout(() => setToast(null), 5000);
        await refresh();
      }

      const [achQ, mineQ, badgeQ, myBadgeQ, msQ] = await Promise.all([
        s.from("achievements").select("*").eq("is_active", true).order("sort_order"),
        s.from("member_achievements").select("achievement_key").eq("member_id", member.id),
        s.from("badges").select("*").eq("is_active", true).order("sort_order"),
        s.from("member_badges").select("badge_key").eq("member_id", member.id),
        s.from("milestones").select("*").eq("is_active", true).order("sort_order"),
      ]);

      setAchievements((achQ.data as Ach[]) ?? []);
      setUnlockedKeys(new Set(((mineQ.data ?? []) as { achievement_key: string }[]).map((r) => r.achievement_key)));
      setBadges((badgeQ.data as Badge[]) ?? []);
      setMyBadges(new Set(((myBadgeQ.data ?? []) as { badge_key: string }[]).map((r) => r.badge_key)));
      setMilestones((msQ.data as Milestone[]) ?? []);
    })();
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member || !metrics) return null;

  const earnedBadges = badges.filter((b) => myBadges.has(b.key));
  const nextMilestone = milestones.find((m) => metrics.spend < m.spend_target);

  return (
    <>
      {toast && (
        <div className="fixed bottom-24 inset-x-4 z-[95] glass-gold p-4 flex items-center gap-3 max-w-sm mx-auto">
          <span className="text-3xl">{toast.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{toast.title}</p>
            {toast.points > 0 && <p className="text-gold text-xs">+{toast.points} נקודות</p>}
          </div>
        </div>
      )}

      {/* Streak */}
      {(member.streak_days ?? 0) > 0 && (
        <section className="glass-gold p-5 flex items-center gap-4">
          <span className="text-3xl">🔥</span>
          <div className="flex-1">
            <p className="font-semibold">{member.streak_days} ימים ברצף</p>
            <p className="text-smoke text-sm">
              השיא שלך: {member.streak_best ?? member.streak_days} ימים
            </p>
          </div>
        </section>
      )}

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <section className="glass p-6">
          <h2 className="font-semibold mb-4">🎖️ התגים שלי</h2>
          <div className="flex flex-wrap gap-3">
            {earnedBadges.map((b) => (
              <div key={b.key} className="glass-gold px-4 py-2 flex items-center gap-2 rounded-full">
                <span className="text-lg">{b.icon}</span>
                <span className="text-sm font-semibold">{b.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Milestone progress */}
      {nextMilestone && (
        <section className="glass p-6">
          <h2 className="font-semibold mb-3">🏅 היעד הבא</h2>
          <div className="flex justify-between text-sm mb-2">
            <span>{nextMilestone.reward_label || nextMilestone.title}</span>
            <span className="text-gold tabular-nums">
              {formatPrice(metrics.spend)} / {formatPrice(nextMilestone.spend_target)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gold transition-all duration-700"
              style={{ width: `${Math.min(100, (metrics.spend / nextMilestone.spend_target) * 100)}%` }} />
          </div>
        </section>
      )}

      {/* Achievements */}
      <section className="glass p-6">
        <h2 className="font-semibold mb-4">
          🏆 הישגים
          <span className="text-smoke text-sm font-normal mr-2">
            {unlockedKeys.size}/{achievements.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => {
            const done = unlockedKeys.has(a.key);
            const cur = Math.min(metrics[a.metric as keyof Metrics] ?? 0, a.threshold);
            return (
              <div key={a.key} className={`glass p-3 ${done ? "border-gold/40" : "opacity-55"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl">{done ? a.icon : "🔒"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <p className="text-smoke text-xs truncate">{a.description}</p>
                    {!done && (
                      <p className="text-gold text-xs mt-1 tabular-nums">{cur}/{a.threshold}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
