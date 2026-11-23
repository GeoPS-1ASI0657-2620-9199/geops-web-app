/** Port that makes a photo lighter before it is uploaded. It never fails: when it cannot help, it answers the same file. */
export abstract class ImageCompressor {
  abstract compress(file: File): Promise<File>;
}
