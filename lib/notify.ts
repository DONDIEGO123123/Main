/** Fire-and-forget owner notification. Never blocks or breaks the user flow. */
export async function notifyOwner(text: string) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch { /* notification failure must never affect the customer */ }
}
