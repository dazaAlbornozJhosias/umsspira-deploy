import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { NlpDictionaryUnavailableError } from '../../domain/errors/nlp-dictionary-unavailable-error';

@Catch(NlpDictionaryUnavailableError)
export class NlpDictionaryUnavailableFilter
  implements ExceptionFilter<NlpDictionaryUnavailableError>
{
  catch(error: NlpDictionaryUnavailableError, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(HttpStatus.SERVICE_UNAVAILABLE).json({
      error: { code: error.code, message: error.message },
    });
  }
}
