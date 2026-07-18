import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Assistant } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import BackToTop from "@/components/BackToTop";
import CookieBanner from "@/components/CookieBanner";
import Analytics from "@/components/Analytics";
import MusicPlayer from "@/components/MusicPlayer";
import LoadingScreen from "@/components/LoadingScreen";
import Script from "next/script";

const display = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
  display: "swap",
});
const body = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "LUXE — חנות יוקרה", template: "%s | LUXE" },
  description: "חוויית קנייה יוקרתית: מוצרי פרימיום, משלוחים מהירים בכל הארץ ושירות אישי.",
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "LUXE",
    title: "LUXE — חנות יוקרה",
    description: "מוצרי פרימיום, משלוחים מהירים בכל הארץ ושירות אישי.",
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="he" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body>
        <LoadingScreen />
        {/* Gold hairline frame — the site's signature */}
        <div aria-hidden className="pointer-events-none fixed inset-2 md:inset-3 z-[60] rounded-2xl border border-gold/20" />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <FloatingButtons />
        <BackToTop />
        <CookieBanner />
        <Analytics />
        <MusicPlayer />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
