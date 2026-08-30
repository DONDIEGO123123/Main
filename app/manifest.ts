import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LUXE — חנות יוקרה",
    short_name: "LUXE",
    description: "מוצרי פרימיום, משלוחים מהירים בכל הארץ.",
    start_url: "/?src=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    dir: "rtl",
    lang: "he",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // long-press the app icon to jump straight in (#51)
    shortcuts: [
      { name: "המוצרים", short_name: "מוצרים", url: "/products" },
      { name: "האזור האישי", short_name: "אישי", url: "/me" },
      { name: "מעקב הזמנה", short_name: "הזמנות", url: "/orders" },
    ],
  };
}
