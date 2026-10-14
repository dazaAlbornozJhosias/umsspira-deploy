import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { DOCUMENT_FILE_FIELD, DOCUMENT_MESSAGES } from '../contracts/document.constants';

// Parte minima de la respuesta HTTP que usa el filtro (evita tipos de express)
interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

/**
 * Conserva los errores del modulo de documentos con su cuerpo original
 * ({ statusCode, message, errors, code }).
 * Multer corta la subida apenas el archivo supera 5 MB: ese caso responde 413
 * con el mensaje oficial de CA-03.3. El filtro global de la API resume todo a
 * { error: mensaje }; este filtro, al ser de controlador, se aplica primero.
 */
@Catch(HttpException)
export class DocumentsExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<JsonResponse>();

    if (exception instanceof PayloadTooLargeException) {
      response.status(413).json({
        statusCode: 413,
        message: DOCUMENT_MESSAGES.invalidFile,
        errors: [{ field: DOCUMENT_FILE_FIELD, message: DOCUMENT_MESSAGES.invalidFile }],
      });
      return;
    }

    const body = exception.getResponse();
    const status = exception.getStatus();
    if (typeof body === 'object' && body !== null) {
      response.status(status).json(body);
      return;
    }
    response.status(status).json({ statusCode: status, message: String(body) });
  }
}
