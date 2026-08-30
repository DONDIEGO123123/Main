"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminPolls() {
  return (
    <EntityManager
      title="הצבעות קהילה"
      table="polls"
      listKeys={["question"]}
      fields={[
        { key: "question", label: "השאלה", type: "text" },
        { key: "description", label: "תיאור", type: "textarea" },
        { key: "options", label: 'אפשרויות — פורמט: ["אפשרות א","אפשרות ב"]', type: "textarea" },
        { key: "reward_points", label: "נקודות על השתתפות", type: "number" },
        { key: "ends_at", label: "תאריך סיום (אופציונלי)", type: "text" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
