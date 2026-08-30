"use client";

export type ProcessOptions = {
  maxWidth?: number;
  quality?: number;
  watermark?: string | null;
};

/**
 * Client-side image pipeline: downscale, compress to WebP, optional watermark.
 * Runs entirely in the browser — no upload cost, no external service.
 */
export async function processImage(file: File, opts: ProcessOptions = {}): Promise<File> {
  const { maxWidth = 1600, quality = 0.82, watermark = null } = opts;

  // videos and non-images pass through untouched
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, w, h);

  if (watermark) {
    const size = Math.max(14, Math.round(w * 0.035));
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    const pad = Math.round(w * 0.025);
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = size * 0.5;
    ctx.fillStyle = "rgba(212,175,55,0.85)";
    ctx.fillText(watermark, w - pad, h - pad);
  }

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/webp", quality)
  );
  if (!blob) return file;

  // keep the original if compression somehow made it bigger
  if (blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}

/** Crop a file to a given aspect ratio (centred). */
export async function cropToRatio(file: File, ratio = 1): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const srcRatio = bitmap.width / bitmap.height;
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (srcRatio > ratio) { sw = bitmap.height * ratio; sx = (bitmap.width - sw) / 2; }
  else { sh = bitmap.width / ratio; sy = (bitmap.height - sh) / 2; }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

export function formatBytes(n: number) {
  return n > 1e6 ? `${(n / 1e6).toFixed(1)}MB` : `${Math.round(n / 1e3)}KB`;
}
