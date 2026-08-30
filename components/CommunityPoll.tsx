"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import { useFlag } from "@/lib/flags";

type Poll = {
  id: string; question: string; description: string;
  options: string[]; reward_points: number; ends_at: string | null;
};

/** Community voting (#23). One vote per member, enforced in the database. */
export default function CommunityPoll() {
  const { member, refresh } = useMember();
  const enabled = useFlag("polls");
  const [poll, setPoll] = useState<Poll | null>(null);
  const [counts, setCounts] = useState<number[]>([]);
  const [voted, setVoted] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const s = createClient();
    const { data } = await s.from("polls").select("*")
      .eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return;

    const p = data as Poll;
    setPoll(p);

    const { data: votes } = await s.from("poll_votes").select("choice,member_id").eq("poll_id", p.id);
    const rows = (votes ?? []) as { choice: number; member_id: string }[];
    setCounts(p.options.map((_, i) => rows.filter((v) => v.choice === i).length));

    const mine = rows.find((v) => v.member_id === member?.id);
    setVoted(mine ? mine.choice : null);
  };

  useEffect(() => { load(); }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled || !poll) return null;

  const total = counts.reduce((a, b) => a + b, 0);
  const ended = poll.ends_at ? new Date(poll.ends_at).getTime() < Date.now() : false;
  const showResults = voted !== null || ended || !member;

  const vote = async (i: number) => {
    if (!member || busy) return;
    setBusy(true);
    const { data } = await createClient().rpc("cast_vote", {
      p_poll_id: poll.id, p_member_id: member.id, p_choice: i,
    });
    setBusy(false);
    if ((data as { ok: boolean })?.ok) { await refresh(); }
    load();
  };

  return (
    <section className="glass p-6">
      <h2 className="font-semibold mb-1">🗳️ {poll.question}</h2>
      {poll.description && <p className="text-smoke text-sm mb-4">{poll.description}</p>}

      <div className="space-y-2 mt-4">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
          const mine = voted === i;

          if (showResults) {
            return (
              <div key={i} className="relative glass p-3 overflow-hidden">
                <div className="absolute inset-y-0 right-0 bg-gold/15 transition-all duration-700"
                  style={{ width: `${pct}%` }} />
                <div className="relative flex items-center gap-2 text-sm">
                  <span className="flex-1">{mine && "✓ "}{opt}</span>
                  <span className="text-gold tabular-nums shrink-0">{pct}%</span>
                </div>
              </div>
            );
          }

          return (
            <button key={i} onClick={() => vote(i)} disabled={busy}
              className="w-full glass p-3 text-right text-sm hover:border-gold/40 transition disabled:opacity-50">
              {opt}
            </button>
          );
        })}
      </div>

      <p className="text-smoke text-xs mt-3">
        {total} הצבעות
        {!showResults && poll.reward_points > 0 && ` · ${poll.reward_points} נקודות על השתתפות`}
        {ended && " · ההצבעה נסגרה"}
      </p>
    </section>
  );
}
