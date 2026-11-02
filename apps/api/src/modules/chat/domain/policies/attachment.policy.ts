import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export function attachmentMetadata(originalName: string, bytes: Uint8Array) {
  const name = originalName
    .replaceAll('\\', '/')
    .split('/')
    .pop()!
    .replace(/[\x00-\x1f\x7f]/g, '')
    .slice(0, 255);
  const extension = name.toLowerCase().split('.').pop();
  const starts = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  let mime: string | null = null;
  if (extension === 'pdf' && starts([0x25, 0x50, 0x44, 0x46, 0x2d])) {
    mime = 'application/pdf';
  }
  if (extension === 'png' && starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    mime = 'image/png';
  }
  if (['jpg', 'jpeg'].includes(extension ?? '') && starts([0xff, 0xd8, 0xff])) {
    mime = 'image/jpeg';
  }
  const office: Record<string, [string, string]> = {
    docx: [
      'word/document.xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    xlsx: ['xl/workbook.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    pptx: [
      'ppt/presentation.xml',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  };
  if (extension && office[extension] && starts([0x50, 0x4b, 0x03, 0x04])) {
    const entries = zipEntries(bytes);
    if (
      entries.has('[Content_Types].xml') &&
      entries.has(office[extension][0]) &&
      ![...entries].some((entry) => entry.toLowerCase().endsWith('vbaproject.bin'))
    ) {
      mime = office[extension][1];
    }
  }
  if (!mime || !bytes.length || bytes.length > MAX_ATTACHMENT_BYTES) {
    throw new BusinessRuleError(
      'invalid',
      'CHAT_INVALID_ATTACHMENT',
      'Adjunta un PDF, JPG, PNG, DOCX, XLSX o PPTX válido de hasta 10 MB',
    );
  }
  return { name, mime, size: bytes.length };
}

// Leer el directorio ZIP sin descomprimir los documentos ni ejecutar su contenido.
function zipEntries(bytes: Uint8Array): Set<string> {
  const result = new Set<string>();
  if (bytes.length < 22) {
    return result;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) {
    end--;
  }
  if (end < Math.max(0, bytes.length - 65557)) {
    return result;
  }
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true),
    totalSize = 0;
  for (let i = 0; i < count; i++) {
    if (
      offset + 46 > end ||
      view.getUint32(offset, true) !== 0x02014b50 ||
      view.getUint16(offset + 8, true) & 1
    ) {
      return new Set();
    }
    totalSize += view.getUint32(offset + 24, true);
    const length = view.getUint16(offset + 28, true),
      extra = view.getUint16(offset + 30, true),
      comment = view.getUint16(offset + 32, true);
    if (offset + 46 + length + extra + comment > end || totalSize > 100 * 1024 * 1024) {
      return new Set();
    }
    result.add(new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + length)));
    offset += 46 + length + extra + comment;
  }
  return result;
}
