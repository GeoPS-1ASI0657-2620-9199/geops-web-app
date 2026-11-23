import { BrowserImageCompressor, MAX_SIDE_PX } from './browser-image-compressor';

/** A noisy photo-like PNG, heavy on purpose, drawn in the real browser of the test run. */
async function heavyPng(width: number, height: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  const pixels = context.createImageData(width, height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i] = (i * 7) % 256;
    pixels.data[i + 1] = Math.floor(Math.random() * 256);
    pixels.data[i + 2] = (i >> 6) % 256;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], 'menu-del-dia.png', { type: 'image/png' });
}

async function sizeOf(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

describe('BrowserImageCompressor', () => {
  const compressor = new BrowserImageCompressor();

  it('scales a large photo down to 1280 px on its longest side and makes it lighter', async () => {
    const original = await heavyPng(2400, 1600);

    const compressed = await compressor.compress(original);

    expect(compressed.size).toBeLessThan(original.size);
    expect(['image/webp', 'image/jpeg']).toContain(compressed.type);
    expect(compressed.name).toMatch(/^menu-del-dia\.(webp|jpg)$/);
    expect(await sizeOf(compressed)).toEqual({ width: MAX_SIDE_PX, height: 853 });
  });

  it('keeps the proportions of a vertical photo', async () => {
    const compressed = await compressor.compress(await heavyPng(900, 1800));

    expect(await sizeOf(compressed)).toEqual({ width: 640, height: MAX_SIDE_PX });
  });

  it('answers the same file when it cannot read it, so Catalog decides', async () => {
    const notAPhoto = new File([new Uint8Array([1, 2, 3, 4])], 'roto.jpg', { type: 'image/jpeg' });

    expect(await compressor.compress(notAPhoto)).toBe(notAPhoto);
  });
});
