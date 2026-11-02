import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { KeywordDictionaryUnavailableError } from '../../domain/errors/keyword-dictionary-unavailable-error';

/**
 * Traduce la indisponibilidad del diccionario NLP al contrato de error del radar.
 * Responde 503 sin filtrar detalles internos y sin haber persistido nada.
 */
@Catch(KeywordDictionaryUnavailableError)
export class KeywordDictionaryUnavailableFilter
  implements ExceptionFilter<KeywordDictionaryUnavailableError>
{
  catch(error: KeywordDictionaryUnavailableError, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(HttpStatus.SERVICE_UNAVAILABLE).json({
      error: { code: error.code, message: error.message },
    });
  }
}
