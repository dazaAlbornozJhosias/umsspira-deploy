import { Controller, Get, UseFilters } from '@nestjs/common';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { GetRadarUseCase } from '../../application/use-cases/get-radar.use-case';
import { requireGraduateScope } from '../../application/services/graduate-scope';
import { KeywordDictionaryUnavailableFilter } from '../filters/keyword-dictionary-unavailable.filter';
import { presentAffinityVector } from '../presenters/affinity-vector.presenter';

@Controller('radar')
@UseFilters(KeywordDictionaryUnavailableFilter)
export class GetRadarController {
  constructor(private readonly getRadarUseCase: GetRadarUseCase) {}

  @Get()
  @RequirePermissions('radar:self:read')
  async getRadar(@CurrentActor() actor: ActorContext) {
    // El id del titulado sale del JWT, nunca de un parámetro de la URL.
    const tituladoId = requireGraduateScope(actor);
    const vector = await this.getRadarUseCase.execute(tituladoId);

    return { data: presentAffinityVector(vector) };
  }
}
