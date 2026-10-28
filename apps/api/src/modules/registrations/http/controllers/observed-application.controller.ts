import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CorrectionTokenGuard } from '../guards/correction-token.guard';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { CorrectionApplicationId } from '../decorators/correction-application-id.decorator';
import { ObservedApplicationService } from '../../application/services/observed-application.service';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import {
  updateObservedDataSchema,
  type UpdateObservedDataInput,
} from '../schemas/registrations.schemas';

@Controller('registrations/observed')
@PublicRegistration()
@UseGuards(CorrectionTokenGuard)
export class ObservedApplicationController {
  constructor(
    private readonly observedApplicationService: ObservedApplicationService,
  ) {}

  @Get()
  async getDetail(@CorrectionApplicationId() applicationId: string) {
    const data =
      await this.observedApplicationService.getObservedApplication(
        applicationId,
      );
    return { data };
  }

  @Patch()
  async updateData(
    @CorrectionApplicationId() applicationId: string,
    @Body(new ZodValidationPipe(updateObservedDataSchema))
    body: UpdateObservedDataInput,
  ) {
    const data =
      await this.observedApplicationService.updateObservedApplication(
        applicationId,
        body,
      );
    return { data };
  }
}
