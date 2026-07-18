"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminPromotions() {
  return (
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
  );
}
