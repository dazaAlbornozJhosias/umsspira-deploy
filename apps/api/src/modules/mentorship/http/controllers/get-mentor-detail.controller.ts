import { Controller, Get, Param } from '@nestjs/common';
import { GetMentorDetailUseCase } from '../../application/use-cases/get-mentor-detail.use-case';
import { presentMentorDetail } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { mentorIdSchema } from '../schemas/mentorship.schemas';

@Controller('mentorship')
export class GetMentorDetailController {
  constructor(private readonly useCase: GetMentorDetailUseCase) {}
  @Get('profiles/:id')
  async handle(@Param('id', new ZodValidationPipe(mentorIdSchema)) id: string) {
    return { data: presentMentorDetail(await this.useCase.execute(id)) };
  }
}
