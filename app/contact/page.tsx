import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import SectionTitle from "@/components/SectionTitle";
import ContactChannels from "@/components/ContactChannels";

export const metadata: Metadata = {
  title: "צור קשר",
  description: "דברו איתנו בטלגרם, בוואטסאפ או דרך טופס יצירת קשר — מענה מהיר בכל שעות היום.",
};

export default function ContactPage() {
  const tg = process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "#";
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "#";
  return (
    <div className="mx-auto max-w-3xl px-4 pt-14">
      <SectionTitle eyebrow="נשמח לשמוע" title="דברו איתנו" sub="הדרך המהירה ביותר — טלגרם או וואטסאפ. אפשר גם להשאיר הודעה כאן." />
      <ContactChannels tg={tg} wa={wa} />
      <ContactForm />
    </div>
  );
}
