"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminReviews() {
  return (
    <EntityManager
      table="reviews"
      title="ביקורות לקוחות"
      listKeys={["author", "content"]}
      fields={[
        { key: "author", label: "שם הלקוח", type: "text", required: true },
        { key: "rating", label: "דירוג (1–5)", type: "number" },
        { key: "content", label: "תוכן הביקורת", type: "textarea", required: true },
        { key: "is_approved", label: "מאושר לפרסום", type: "boolean" },
      ]}
    />
  );
}
