import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetApplicationMetricsUseCase } from '../../application/use-cases/get-application-metrics.use-case';

@Controller('applications')
export class GetApplicationMetricsController {
  constructor(private readonly useCase: GetApplicationMetricsUseCase) {}

  // Ruta fija: el módulo debe registrar este controlador ANTES que el de ':id',
  // para que "metrics" no se interprete como el identificador de una solicitud.
  @Get('metrics')
  @RequirePermissions('solicitudes:read')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: await this.useCase.execute(actor) };
  }
}