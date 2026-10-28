import { Body, Controller, HttpCode, Post, UseFilters } from '@nestjs/common';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ExtractKeywordsUseCase } from '../../application/use-cases/extract-keywords.use-case';
import { presentExtractedKeywords } from '../presenters/extract-keywords.presenter';
import { NlpDictionaryUnavailableFilter } from '../filters/nlp-dictionary-unavailable.filter';
import {
  extractKeywordsSchema,
  type ExtractKeywordsInput,
} from '../schemas/extract-keywords.schema';

@Controller('nlp')
@UseFilters(NlpDictionaryUnavailableFilter)
export class ExtractKeywordsController {
  constructor(private readonly useCase: ExtractKeywordsUseCase) {}

  @Post('extract')
  @HttpCode(200)
  @RequirePermissions('nlp:extract')
  async extract(@Body(new ZodValidationPipe(extractKeywordsSchema)) body: ExtractKeywordsInput) {
    return { data: presentExtractedKeywords(await this.useCase.execute(body.text)) };
  }
}
