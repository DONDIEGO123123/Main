"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminBanners() {
  return (
    <EntityManager
      table="banners"
      title="באנרים (סליידר ראשי)"
      orderBy="sort_order"
      ascending
      listKeys={["headline", "subheadline"]}
      fields={[
        { key: "headline", label: "כותרת ראשית", type: "text", required: true },
        { key: "subheadline", label: "כותרת משנה", type: "textarea" },
        { key: "image_url", label: "תמונת רקע", type: "image" },
        { key: "cta_label", label: "טקסט כפתור", type: "text" },
        { key: "cta_url", label: "קישור כפתור", type: "text" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
