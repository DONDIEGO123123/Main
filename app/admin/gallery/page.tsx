"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminGallery() {
  return (
    <EntityManager
      title="גלריית לקוחות"
      table="customer_photos"
      fields={[
        { key: "image_url", label: "תמונה", type: "image" },
        { key: "caption", label: "כיתוב (אופציונלי)", type: "text" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_approved", label: "מאושר לפרסום", type: "boolean" },
      ]}
    />
  );
}
