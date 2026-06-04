// Client-side image preparation for the photo-matching intake.
//
// Phone photos from a besiktning are large (3–12 MB HEIC/JPG). Sending them at
// full resolution to /api/match-photo → Gemini is slow and burns the free-tier
// quota faster than necessary. We downscale to a sane edge length and re-encode
// as JPEG in the browser before upload. HEIC (iPhone default) is converted to
// JPEG first since neither <canvas> nor Gemini handle it reliably.

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;

export interface PreparedImage {
  base64: string; // RAW base64 (no data: prefix) — matches what /api/match-photo expects
  mime: string;
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  // iOS sometimes hands over HEIC files with an empty MIME type, so fall back
  // to the extension.
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

function blobToRawBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      // result is "data:<mime>;base64,<payload>" — strip the prefix.
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

async function heicToJpegBlob(file: File): Promise<Blob> {
  // Dynamically imported so the (large) decoder only loads when a HEIC file
  // actually shows up.
  const heic2any = (await import("heic2any")).default;
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  // heic2any returns Blob | Blob[] depending on the source.
  return Array.isArray(out) ? out[0] : out;
}

async function downscaleToJpeg(blob: Blob): Promise<Blob | null> {
  // createImageBitmap is the fast path and avoids the <img>-onload dance.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return null; // unsupported in this browser / undecodable — caller falls back
  }
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY);
  });
}

/**
 * Convert a user-picked or camera-captured file into a downscaled JPEG, returned
 * as raw base64 ready to POST to /api/match-photo. Never throws for image
 * content: on any failure it falls back to the original bytes so intake keeps
 * working (just larger).
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  let source: Blob = file;

  if (isHeic(file)) {
    try {
      source = await heicToJpegBlob(file);
    } catch {
      // Conversion failed — fall through with the original; downscale may still
      // succeed, and if not we send the original bytes.
      source = file;
    }
  }

  const downscaled = await downscaleToJpeg(source);
  if (downscaled) {
    return { base64: await blobToRawBase64(downscaled), mime: "image/jpeg" };
  }

  // Fallback: send what we have. Prefer the converted JPEG over a raw HEIC.
  const fallbackMime = source === file ? file.type || "image/jpeg" : "image/jpeg";
  return { base64: await blobToRawBase64(source), mime: fallbackMime };
}
