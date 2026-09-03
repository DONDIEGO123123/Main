import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export const metadata = {
  title: "מדיניות ותנאים",
  description: "החזרות, משלוחים, פרטיות ותמיכה.",
};

type Policy = { id: string; slug: string; title: string; icon: string; body: string };

/** Clear policies are one of the strongest trust signals a small shop has. */
export default async function PoliciesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("policies")
    .select("id,slug,title,icon,body")
    .eq("is_active", true)
    .order("sort_order");

  const policies = (data as Policy[]) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-display-md font-bold">מדיניות ותנאים</h1>
      <p className="text-smoke mt-4">
        חשוב לנו שתדעו בדיוק מה קורה לפני ההזמנה ואחריה.
      </p>
      <div className="rule mt-8" aria-hidden />

      {policies.length === 0 ? (
        <p className="text-smoke mt-10">המדיניות תתעדכן בקרוב.</p>
      ) : (
        <div className="mt-12 space-y-4">
          {policies.map((p) => (
            <section key={p.id} id={p.slug} className="glass-thin p-7 scroll-mt-24">
              <h2 className="font-semibold text-lg flex items-center gap-3">
                <span aria-hidden>{p.icon}</span>
                {p.title}
              </h2>
              <div className="mt-4 text-white/70 leading-loose whitespace-pre-line">
                {p.body}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="glass-gold p-7 mt-10 text-center">
        <p className="font-semibold">נשארה שאלה?</p>
        <p className="text-smoke text-sm mt-2">נשמח לענות לפני שאתם מזמינים.</p>
        <Link href="/support" className="btn-gold inline-block mt-5">
          למרכז התמיכה
        </Link>
      </div>
    </main>
  );
}
