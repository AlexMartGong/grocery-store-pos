/**
 * Client-side product-image optimization: downscales to a max dimension and
 * re-encodes as WebP on a canvas before upload, so multi-MB phone photos become
 * lightweight uploads. Best-effort by contract — any failure (decode, canvas,
 * encoder) resolves with the ORIGINAL file; the backend stays the final validator.
 */

interface DecodedImage {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}

const decodeViaImageElement = (file: File): Promise<DecodedImage> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });

const decodeImage = async (file: File): Promise<DecodedImage> => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      /* fall through to <img> decoding */
    }
  }
  return decodeViaImageElement(file);
};

const toWebPBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      // Browsers without a WebP encoder return a PNG blob (or null) — reject so
      // the caller falls back instead of uploading mislabeled bytes.
      (blob) =>
        blob && blob.type === "image/webp"
          ? resolve(blob)
          : reject(new Error("webp encode failed")),
      "image/webp",
      quality,
    );
  });

export const compressAndConvertToWebP = async (
  file: File,
  maxDimension = 800,
  quality = 0.82,
): Promise<File> => {
  let decoded: DecodedImage | null = null;
  try {
    decoded = await decodeImage(file);
    const { width, height } = decoded;
    if (width <= 0 || height <= 0) return file;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(decoded.source, 0, 0, targetWidth, targetHeight);
    const blob = await toWebPBlob(canvas, quality);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    /* optimization is best-effort — upload the original on any failure */
    return file;
  } finally {
    decoded?.cleanup();
  }
};
