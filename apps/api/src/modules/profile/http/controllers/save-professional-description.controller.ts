import { Body, Controller, Put } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { SaveProfessionalDescriptionUseCase } from '../../application/use-cases/save-professional-description.use-case';
import { presentDescription } from '../presenters/profile.presenter';
import {
  professionalDescriptionSchema,
  type ProfessionalDescriptionBody,
} from '../schemas/profile.schemas';

@Controller('perfil')
export class SaveProfessionalDescriptionController {
  constructor(private readonly useCase: SaveProfessionalDescriptionUseCase) {}

  @Put('descripcion-profesional')
  @RequirePermissions('perfil:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(professionalDescriptionSchema)) body: ProfessionalDescriptionBody,
  ) {
    return {
      data: presentDescription(await this.useCase.execute(actor, body.descripcionProfesional)),
    };
  }
}
