import { BusinessRuleError } from '../../errors/business-rule-error';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(name: string, bytes: Uint8Array, jpegOnly = false): string {
  const extension = name.toLowerCase().split('.').pop();
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
    (value, index) => bytes[index] === value,
  );
  const webp =
    [0x52, 0x49, 0x46, 0x46].every((value, index) => bytes[index] === value) &&
    [0x57, 0x45, 0x42, 0x50].every((value, index) => bytes[index + 8] === value);
  const mime =
    jpeg && ['jpg', 'jpeg'].includes(extension ?? '')
      ? 'image/jpeg'
      : !jpegOnly && png && extension === 'png'
        ? 'image/png'
        : !jpegOnly && webp && extension === 'webp'
          ? 'image/webp'
          : null;
  if (!mime || !bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw new BusinessRuleError(
      'invalid',
      'INVALID_IMAGE',
      jpegOnly
        ? 'Adjunta una imagen JPG válida de máximo 5 MB'
        : 'Adjunta una imagen JPG, PNG o WebP válida de máximo 5 MB',
    );
  }
  return mime;
}

export function safeFileName(value: string): string {
  return (
    value
      .replaceAll('\\', '/')
      .split('/')
      .pop()!
      .replace(/[\x00-\x1f\x7f]/g, '')
      .slice(0, 255) || 'imagen'
  );
}
