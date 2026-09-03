import { createClient } from "@/lib/supabase/server";

type Badge = { id: string; icon: string; title: string; body: string };

/**
 * Trust signals — facts about how the shop operates, editable from admin.
 * Nothing here is a number or a claim the shop can't back up.
 */
export default async function TrustBadges() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trust_badges")
    .select("id,icon,title,body")
    .eq("is_active", true)
    .order("sort_order");

  const badges = (data as Badge[]) ?? [];
  if (badges.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 mt-24">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
        {badges.map((b) => (
          <div key={b.id} className="bg-ink p-7 text-center">
            <p className="text-3xl mb-3" aria-hidden>{b.icon}</p>
            <p className="font-semibold">{b.title}</p>
            {b.body && (
              <p className="text-smoke text-sm mt-2 leading-relaxed">{b.body}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
