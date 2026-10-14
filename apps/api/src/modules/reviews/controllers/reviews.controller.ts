import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '@umsspira/shared-types';
import { AuthGuard, CurrentUser, RolesGuard } from '@/shared/guards';
import { Roles } from '@/shared/guards/roles.decorator';
import { CreateReviewDto } from '../contracts/dto/create-review.dto';
import { ListApplicationsQueryDto } from '../contracts/dto/list-applications-query.dto';
import { ReviewsService } from '../services/reviews.service';
import { ApplicationsService } from '../services/applications.service';

@Controller('api/applications')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  // Las rutas fijas van primero para que Express no las confunda con ':id'.
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('administrador')
  async listApplications(@Query() query: ListApplicationsQueryDto) {
    const data = await this.applicationsService.listApplications(query);
    return { data };
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('administrador')
  async getApplication(@Param('id') applicationId: string) {
    const data = await this.applicationsService.getApplication(applicationId);
    return { data };
  }

  @Get(':id/document')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('administrador')
  async getApplicationDocument(@Param('id') applicationId: string) {
    const detail = await this.applicationsService.getApplication(applicationId);
    if (!detail.documentPath) {
      return { data: null };
    }
    const data = await this.applicationsService.getDocumentUrl(detail.documentPath);
    return { data };
  }

  @Post(':id/review')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('administrador')
  async createReview(
    @Param('id') applicationId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.reviewsService.createReview(
      applicationId,
      dto,
      user.id,
    );
    return { data };
  }
}
