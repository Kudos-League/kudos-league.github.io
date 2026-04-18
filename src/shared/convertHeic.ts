/**
 * Converts a HEIC/HEIF file to JPEG in the browser before upload.
 * On iOS in standalone PWA mode, photos are sent as raw HEIC without
 * browser-level conversion, so we must handle it explicitly.
 *
 * heic2any is lazy-imported so it doesn't bloat the initial bundle.
 */
export async function ensureJpeg(file: File): Promise<File> {
    if (!file.type.match(/^image\/(heic|heif)$/i) && !file.name.match(/\.heic$/i)) {
        return file;
    }

    const { default: heic2any } = await import('heic2any');
    const blob = (await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92
    })) as Blob;

    const safeName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg') || 'photo.jpg';
    return new File([blob], safeName, { type: 'image/jpeg' });
}

/**
 * Converts an array of files, replacing any HEIC/HEIF entries with JPEG.
 * Non-HEIC files pass through unchanged.
 */
export async function ensureJpegAll(files: File[]): Promise<File[]> {
    return Promise.all(files.map(ensureJpeg));
}
