"use client";
import Link from "next/link";
import { useMember } from "@/lib/member";

/** Floating member badge — profile when signed in, join CTA when not. */
export default function MemberButton() {
  const { member, ready } = useMember();
  if (!ready) return null;

  return (
    <Link
      href={member ? "/me" : "/join"}
      aria-label={member ? "האזור האישי" : "הצטרפות לקהילה"}
      className="fixed bottom-5 left-5 z-50 h-12 min-w-[44px] min-w-[44px] px-4 rounded-full glass-gold text-gold flex items-center gap-2 shadow-glow"
    >
      {member ? (
        <>
          <span className="text-lg">💎</span>
          <span className="font-bold tabular-nums text-sm">{member.points}</span>
        </>
      ) : (
        <span className="text-lg">👤</span>
      )}
    </Link>
  );
}
