import { Injectable } from '@angular/core';
import { ImageCompressor } from '../domain/ports/image-compressor';

/** Longest side of the stored photo: the offer card and the detail never show it larger. */
export const MAX_SIDE_PX = 1280;
const WEBP_QUALITY = 0.8;
const JPEG_QUALITY = 0.82;

/**
 * ImageCompressor over the browser canvas, with no library: it scales the photo down to
 * MAX_SIDE_PX and encodes it as WebP (JPEG where the browser cannot write WebP). A phone photo
 * of 3 to 5 MB ends up around 150 to 300 KB. If the photo cannot be read or does not get lighter,
 * the original goes up and Catalog still checks it.
 */
@Injectable()
export class BrowserImageCompressor implements ImageCompressor {
  async compress(file: File): Promise<File> {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d');
      if (!context) {
        bitmap.close();
        return file;
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob =
        (await encode(canvas, 'image/webp', WEBP_QUALITY)) ?? (await encode(canvas, 'image/jpeg', JPEG_QUALITY));
      if (!blob || blob.size >= file.size) {
        return file;
      }
      return new File([blob], renamed(file.name, blob.type), { type: blob.type, lastModified: file.lastModified });
    } catch {
      return file;
    }
  }
}

/** The blob in that type, or null when the browser writes another one (Safari answers PNG for WebP). */
function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob && blob.type === type ? blob : null), type, quality),
  );
}

function renamed(name: string, type: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'foto';
  return `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}`;
}
