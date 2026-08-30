"use client";
import Link from "next/link";
import { useMember } from "@/lib/member";
import { useLang } from "@/lib/i18n";

/** Homepage community CTA. Shows a join pitch to guests, a status card to members. */
export default function JoinBanner() {
  const { member, ready } = useMember();
  const { t } = useLang();
  if (!ready) return null;

  if (member) {
    return (
      <section className="mx-auto max-w-7xl px-4 mt-20">
        <Link href="/me" className="glass-gold p-6 flex items-center gap-4 hover:border-gold/40 transition">
          <span className="text-3xl">💎</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">שלום {member.display_name}</p>
            <p className="text-smoke text-sm">{member.points} נקודות · לחצו לצפייה בהטבות שלכם</p>
          </div>
          <span className="text-gold shrink-0">←</span>
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 mt-20">
      <div className="glass-gold p-8 text-center">
        <p className="text-4xl mb-3">🔥</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold gold-text">{t("joinCommunity")}</h2>
        <p className="text-smoke mt-2 max-w-md mx-auto">
          נקודות על כל הזמנה, רמות VIP עם הנחה קבועה, והטבות בלעדיות. הרשמה עם טלפון בלבד.
        </p>
        <Link href="/join" className="btn-gold inline-block mt-6 px-8 py-3">{t("joinFree")} ←</Link>
      </div>
    </section>
  );
}
