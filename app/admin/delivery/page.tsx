"use client";
import EntityManager from "@/components/admin/EntityManager";

const regions = [
  { value: "north", label: "צפון" },
  { value: "haifa", label: "חיפה" },
  { value: "center", label: "מרכז" },
  { value: "tel-aviv", label: "תל אביב" },
  { value: "jerusalem", label: "ירושלים" },
  { value: "south", label: "דרום" },
];

export default function AdminDelivery() {
  return (
    <EntityManager
      table="delivery_areas"
      title="אזורי משלוח"
      orderBy="region"
      ascending
      listKeys={["name", "eta"]}
      fields={[
        { key: "region", label: "אזור במפה", type: "select", options: regions },
        { key: "name", label: "שם לתצוגה", type: "text", required: true },
        { key: "eta", label: "זמן אספקה", type: "text" },
        { key: "fee", label: "דמי משלוח (₪)", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
