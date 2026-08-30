"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminBadges() {
  return (
    <EntityManager
      title="תגי חברים"
      table="badges"
      listKeys={["label", "description"]}
      orderBy="sort_order"
      ascending
      fields={[
        { key: "key", label: "מזהה (באנגלית, ייחודי)", type: "text" },
        { key: "label", label: "שם התג", type: "text" },
        { key: "icon", label: "אייקון", type: "text" },
        { key: "description", label: "תיאור", type: "text" },
        { key: "auto_rule", label: "כלל אוטומטי (level:vip / orders:10 / manual)", type: "text" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
