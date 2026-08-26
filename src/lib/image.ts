import imageCompression from 'browser-image-compression';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 500 * 1024; // 500 KB post-compression
const MAX_DIMENSION_PX = 1920;

export interface ProcessedImage {
  file: File;
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  sizeBytesOriginal: number;
  sizeBytesCompressed: number;
}

/**
 * Validates MIME type, compresses the image, and strips EXIF metadata.
 * Throws a user-readable string on failure.
 */
export async function processImage(raw: File): Promise<ProcessedImage> {
  if (!ALLOWED_MIME_TYPES.has(raw.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed.');
  }

  const sizeBytesOriginal = raw.size;

  // 1. Strip EXIF by re-drawing through canvas (no exifr needed on client)
  const stripped = await stripExifViaCanvas(raw);

  // 2. Compress
  const compressed = await imageCompression(stripped, {
    maxSizeMB: MAX_SIZE_BYTES / (1024 * 1024),
    maxWidthOrHeight: MAX_DIMENSION_PX,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.82,
  });

  // 3. Read dimensions from compressed file
  const { width, height, dataUrl } = await getImageMeta(compressed);

  if (Math.min(width, height) < 320) {
    throw new Error('Image resolution is too low. Please take a clearer photo.');
  }

  return {
    file: compressed,
    dataUrl,
    widthPx: width,
    heightPx: height,
    sizeBytesOriginal,
    sizeBytesCompressed: compressed.size,
  };
}

/**
 * Strips EXIF by drawing the image to a canvas and exporting as a new blob.
 * Canvas API does not preserve EXIF metadata.
 */
async function stripExifViaCanvas(file: File): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) { reject(new Error('Failed to strip EXIF')); return; }
            resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.95
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for processing.'));
    };

    img.src = url;
  });
}

/** Returns width, height, and base64 data URL for the given file. */
function getImageMeta(file: File): Promise<{ width: number; height: number; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, dataUrl });
      img.onerror = () => reject(new Error('Failed to read image dimensions.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/** Builds the storage path for a complaint image. */
export function buildImagePath(userId: string, complaintId: string, suffix = 'photo'): string {
  const ts = Date.now();
  return `${userId}/${complaintId}/${suffix}_${ts}.jpg`;
}
