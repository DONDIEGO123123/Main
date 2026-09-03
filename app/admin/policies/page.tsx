"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminPolicies() {
  return (
    <div className="space-y-8">
      <div className="glass p-5">
        <p className="font-semibold mb-2">מדיניות ברורה מוכרת</p>
        <p className="text-smoke text-sm leading-relaxed">
          לקוח שרואה בדיוק מה קורה אם משהו משתבש, מזמין בביטחון רב יותר.
          עדכנו את הטקסטים כך שיתאימו למה שאתם באמת עושים.
        </p>
      </div>

      <EntityManager
        title="מדיניות ותנאים"
        table="policies"
        listKeys={["title"]}
        orderBy="sort_order"
        ascending
        fields={[
          { key: "slug", label: "מזהה באנגלית (לקישור ישיר)", type: "text" },
          { key: "icon", label: "אייקון", type: "text" },
          { key: "title", label: "כותרת", type: "text" },
          { key: "body", label: "תוכן", type: "textarea" },
          { key: "sort_order", label: "סדר תצוגה", type: "number" },
          { key: "is_active", label: "פעיל", type: "boolean" },
        ]}
      />
    </div>
  );
}
