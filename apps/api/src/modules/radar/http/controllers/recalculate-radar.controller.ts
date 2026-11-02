import { Controller, HttpCode, Inject, Post, UseFilters } from '@nestjs/common';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import {
  PROFILE_TEXT_READER_PORT,
  type ProfileTextReaderPort,
} from '../../application/ports/profile-text-reader.port';
import { requireGraduateScope } from '../../application/services/graduate-scope';
import { RecalculateRadarUseCase } from '../../application/use-cases/recalculate-radar.use-case';
import { KeywordDictionaryUnavailableFilter } from '../filters/keyword-dictionary-unavailable.filter';
import { presentAffinityVector } from '../presenters/affinity-vector.presenter';

@Controller('radar')
@UseFilters(KeywordDictionaryUnavailableFilter)
export class RecalculateRadarController {
  constructor(
    private readonly recalculateRadarUseCase: RecalculateRadarUseCase,
    @Inject(PROFILE_TEXT_READER_PORT)
    private readonly profileTextReader: ProfileTextReaderPort,
  ) {}

  @Post('recalculate')
  @HttpCode(200)
  @RequirePermissions('radar:self:write')
  async recalculate(@CurrentActor() actor: ActorContext) {
    const tituladoId = requireGraduateScope(actor);
    const profileTexts = await this.profileTextReader.getProfileTexts(tituladoId);
    const vector = await this.recalculateRadarUseCase.execute(
      tituladoId,
      profileTexts.texts,
      profileTexts.hasLaborHistory,
    );

    return { data: presentAffinityVector(vector, { includeRecalculated: true }) };
  }
}
