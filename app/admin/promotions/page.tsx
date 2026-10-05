"use client";
import Link from "next/link";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminPromotions() {
  return (
    <div className="space-y-6">
      <EntityManager
        table="promotions"
        title="מבצעים"
        orderBy="sort_order"
        ascending
        listKeys={["title", "subtitle"]}
        fields={[
          { key: "title", label: "כותרת", type: "text", required: true },
          { key: "subtitle", label: "כותרת משנה", type: "text" },
          { key: "image_url", label: "תמונת רקע", type: "image" },
          { key: "cta_label", label: "טקסט כפתור", type: "text" },
          { key: "cta_url", label: "קישור כפתור", type: "text" },
          { key: "sort_order", label: "סדר תצוגה", type: "number" },
          { key: "is_active", label: "פעיל", type: "boolean" },
        ]}
      />

      {/* publishing a promotion is the moment you'd want to tell people */}
      <Link
        href="/admin/push"
        className="glass-gold p-5 flex items-center gap-4 transition-colors duration-base ease-luxe hover:border-gold/50"
      >
        <span className="text-2xl shrink-0" aria-hidden>🔔</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">להודיע ללקוחות על המבצע</p>
          <p className="text-smoke text-xs mt-0.5">
            שליחת התראה לטלפון של כל מי שנרשם
          </p>
        </div>
        <span className="text-gold shrink-0">←</span>
      </Link>
    </div>
  );
}
