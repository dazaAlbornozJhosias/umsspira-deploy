import { All, Controller, HttpException, Query, Req } from '@nestjs/common';
import { ListMentorProfilesUseCase } from '../../application/use-cases/list-mentor-profiles.use-case';
import { presentDirectory, presentDirectoryCatalog } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import {
  mentorDirectoryQuerySchema,
  type MentorDirectoryQueryInput,
} from '../schemas/mentor-directory-query.schema';

@Controller('mentorship')
export class ListMentorProfilesController {
  constructor(private readonly useCase: ListMentorProfilesUseCase) {}
  @All('profiles')
  async handle(
    @Req() request: { method: string },
    @Query(new ZodValidationPipe(mentorDirectoryQuerySchema)) query: MentorDirectoryQueryInput,
  ) {
    if (request.method !== 'GET') {
      throw new HttpException('El directorio solo permite consultas GET', 405);
    }
    const result = await this.useCase.execute(query);
    return {
      data: result.entries.map(presentDirectory),
      total: result.total,
      catalog: presentDirectoryCatalog(result.catalog),
    };
  }
}
