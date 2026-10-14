import { ForbiddenException, PayloadTooLargeException } from '@nestjs/common';
import { DocumentsExceptionFilter } from './documents-exception.filter';
import { DOCUMENT_MESSAGES } from '../contracts/document.constants';

function runFilter(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  new DocumentsExceptionFilter().catch(exception as never, {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as never);
  return { json, status };
}

describe('DocumentsExceptionFilter', () => {
  it('responde 413 con el mensaje oficial cuando el archivo supera 5 MB (CA-03.3)', () => {
    const { json, status } = runFilter(new PayloadTooLargeException('File too large'));

    expect(status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith({
      statusCode: 413,
      message: DOCUMENT_MESSAGES.invalidFile,
      errors: [{ field: 'archivo', message: DOCUMENT_MESSAGES.invalidFile }],
    });
  });

  it('conserva el codigo EMAIL_NOT_VERIFIED del 403 (CA-03.1)', () => {
    const body = {
      statusCode: 403,
      code: 'EMAIL_NOT_VERIFIED',
      message: DOCUMENT_MESSAGES.emailNotVerified,
    };

    const { json, status } = runFilter(new ForbiddenException(body));

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(body);
  });
});
