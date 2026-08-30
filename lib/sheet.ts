/** Fire-and-forget order sync to Google Sheets. Never blocks checkout. */
export async function syncToSheet(order: Record<string, unknown>) {
  try {
    await fetch("/api/sheet-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
  } catch { /* a failed sync must never affect the customer */ }
}
