import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "השלמת הזמנה",
  description: "פרטי משלוח והשלמת ההזמנה",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-5xl">
      <SectionTitle title="השלמת הזמנה" subtitle="עוד רגע קטן והמוצרים בדרך אליכם" />
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </main>
  );
}
