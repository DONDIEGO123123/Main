/** Levenshtein distance — small enough to run on a product list client-side. */
function distance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/** Hebrew-friendly normalisation: strip niqqud, finals, and punctuation. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ץ/g, "צ")
    .replace(/ף/g, "פ").replace(/ך/g, "כ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

/** True when the query loosely matches the text, tolerating typos. */
export function fuzzyMatch(text: string, query: string): boolean {
  const t = normalize(text);
  const q = normalize(query);
  if (!q) return false;
  if (t.includes(q)) return true;

  // allow more slack on longer queries
  const tolerance = q.length <= 3 ? 0 : q.length <= 5 ? 1 : 2;
  if (tolerance === 0) return false;

  return t.split(/\s+/).some((word) => {
    if (Math.abs(word.length - q.length) > tolerance + 1) return false;
    return distance(word, q) <= tolerance;
  });
}

/** Rank: exact prefix beats contains, which beats a fuzzy hit. */
export function score(text: string, query: string): number {
  const t = normalize(text), q = normalize(query);
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  return fuzzyMatch(text, query) ? 1 : 0;
}
