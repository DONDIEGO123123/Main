"use client";
import { createClient } from "@/lib/supabase/client";

/** Write an admin action to the audit log (#46). */
export async function logAction(
  action: string,
  detail = "",
  entityType?: string,
  entityId?: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  try {
    const { data: { user } } = await createClient().auth.getUser();
    await createClient().from("audit_log").insert({
      actor: user?.email ?? "unknown",
      action,
      detail,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    });
  } catch {
    /* logging must never block the action it records */
  }
}

export const ACTION_LABELS: Record<string, string> = {
  create: "יצירה",
  update: "עדכון",
  delete: "מחיקה",
  restore: "שחזור",
  price_change: "שינוי מחיר",
  stock_change: "שינוי מלאי",
  login: "כניסה",
  settings: "שינוי הגדרות",
};
