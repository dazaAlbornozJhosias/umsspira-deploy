import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { MAX_FILE_BYTES } from './registration.policy';

export function validateDocument(name: string, bytes: Uint8Array): string {
  const extension = name.split('.').pop()?.toLowerCase();
  const formats = [
    { extensions: ['pdf'], mime: 'application/pdf', signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
    {
      extensions: ['png'],
      mime: 'image/png',
      signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    },
    { extensions: ['jpg', 'jpeg'], mime: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  ];
  const format = formats.find(
    (item) =>
      item.extensions.includes(extension ?? '') &&
      item.signature.every((byte, index) => bytes[index] === byte),
  );
  if (!format || !bytes.length || bytes.length > MAX_FILE_BYTES) {
    throw new BusinessRuleError(
      'invalid',
      'INVALID_DOCUMENT',
      'Adjunta un PDF, PNG o JPG de máximo 5 MB con formato válido',
    );
  }
  return format.mime;
}
