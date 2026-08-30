"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminFeed() {
  return (
    <EntityManager
      title="עדכוני קהילה"
      table="feed_items"
      listKeys={["title", "body"]}
      fields={[
        { key: "title", label: "כותרת", type: "text" },
        { key: "body", label: "תוכן", type: "textarea" },
        { key: "icon", label: "אייקון", type: "text" },
        { key: "image_url", label: "תמונה (אופציונלי)", type: "image" },
        { key: "link", label: "קישור (אופציונלי)", type: "text" },
        { key: "kind", label: "סוג", type: "select", options: [
          { value: "announcement", label: "הודעה" },
          { value: "product", label: "מוצר חדש" },
          { value: "reward", label: "הטבה" },
          { value: "challenge", label: "אתגר" },
        ] },
        { key: "is_pinned", label: "נעוץ למעלה", type: "boolean" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
