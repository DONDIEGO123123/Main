import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export const metadata = {
  title: "מי אנחנו",
  description: "הסיפור שמאחורי החנות.",
};

type Site = {
  name?: string;
  about_title?: string;
  about_body?: string;
  about_image?: string;
  owner_name?: string;
  whatsapp?: string;
};

/**
 * The owner's face and story.
 *
 * For a small shop this builds more trust than any rating: it shows there
 * is a real person who answers when something goes wrong.
 */
export default async function AboutPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings").select("value").eq("key", "site").maybeSingle();
  const site = (data?.value ?? {}) as Site;

  const hasStory = !!site.about_body;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="grid md:grid-cols-5 gap-10 items-start">
        <div className="md:col-span-2">
          {site.about_image ? (
            <div className="glass-thin overflow-hidden rounded-2xl aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.about_image}
                alt={site.owner_name || "בעל החנות"}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="glass-thin rounded-2xl aspect-[4/5] grid place-items-center">
              <p className="text-gold/25 text-5xl" aria-hidden>✦</p>
            </div>
          )}
        </div>

        <div className="md:col-span-3">
          <h1 className="font-display text-display-md font-bold">
            {site.about_title || `הסיפור מאחורי ${site.name || "LUXE"}`}
          </h1>
          <div className="rule mt-6 w-24" aria-hidden />

          {hasStory ? (
            <div className="mt-7 text-white/75 leading-loose whitespace-pre-line">
              {site.about_body}
            </div>
          ) : (
            <p className="mt-7 text-smoke leading-loose">
              אנחנו חנות קטנה שמאמינה שאפשר לקבל מוצרים איכותיים עם שירות
              שמרגישים בו אדם בצד השני. כל הזמנה עוברת דרכנו אישית, ואם משהו
              לא מסתדר — אנחנו כאן כדי לתקן.
            </p>
          )}

          {site.owner_name && (
            <p className="mt-8 font-display text-lg text-gold">— {site.owner_name}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-10">
            <Link href="/products" className="btn-gold">לקטלוג</Link>
            <Link href="/support" className="btn-ghost">דברו איתנו</Link>
          </div>
        </div>
      </div>

      <div className="rule my-14" aria-hidden />

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["↩️", "החזרות תוך 14 יום", "/policies#returns"],
          ["🚚", "משלוח לכל הארץ", "/policies#shipping"],
          ["🔒", "הפרטים שלכם שמורים", "/policies#privacy"],
        ].map(([icon, label, href]) => (
          <Link
            key={href}
            href={href}
            className="glass-thin p-6 text-center transition-colors duration-base ease-luxe hover:border-gold/30"
          >
            <p className="text-2xl mb-2" aria-hidden>{icon}</p>
            <p className="text-sm">{label}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
