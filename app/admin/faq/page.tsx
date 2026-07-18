"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminFaq() {
  return (
    <EntityManager
      table="faq"
      title="שאלות נפוצות"
      orderBy="sort_order"
      ascending
      listKeys={["question"]}
      fields={[
        { key: "question", label: "שאלה", type: "text", required: true },
        { key: "answer", label: "תשובה", type: "textarea", required: true },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
