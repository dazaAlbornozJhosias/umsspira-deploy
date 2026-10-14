import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { AddInterestsDto } from './dto/add-interests.dto';
import {
  InterestCatalogGroup,
  MentorInterest,
  RemovedInterest,
} from './mentorship-interests.model';
import { MentorshipInterestsService } from './mentorship-interests.service';
import { MentorAuthGuard } from './mentor-test-auth.guard';

/** Se asume que el guard de autenticación del equipo inyecta req.user.id. */
type AuthenticatedRequest = Request & { user?: { id?: string } };

// TODO: aplicar el guard de autenticación del proyecto a nivel de clase:
// @UseGuards(AuthGuard)
// Mientras tanto, mismo guard de prueba que el resto del módulo (solo desarrollo).
@UseGuards(MentorAuthGuard)
@Controller('mentorship')
export class MentorshipInterestsController {
  constructor(private readonly interestsService: MentorshipInterestsService) {}

  /** GET /mentorship/interests/catalog */
  @Get('interests/catalog')
  getCatalog(@Req() req: AuthenticatedRequest): Promise<InterestCatalogGroup[]> {
    return this.interestsService.getCatalog(this.userId(req));
  }

  /** GET /mentorship/interests/mine */
  @Get('interests/mine')
  getMyInterests(@Req() req: AuthenticatedRequest): Promise<MentorInterest[]> {
    return this.interestsService.getMyInterests(this.userId(req));
  }

  /** POST /mentorship/interests */
  @Post('interests')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  addInterests(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddInterestsDto,
  ): Promise<MentorInterest[]> {
    return this.interestsService.addInterests(this.userId(req), dto);
  }

  /** DELETE /mentorship/interests/:interestId */
  @Delete('interests/:interestId')
  removeInterest(
    @Req() req: AuthenticatedRequest,
    @Param('interestId', ParseUUIDPipe) interestId: string,
  ): Promise<RemovedInterest> {
    return this.interestsService.removeInterest(this.userId(req), interestId);
  }

  /** Evita un 500 si el guard de auth aún no inyectó el usuario. */
  private userId(req: AuthenticatedRequest): string {
    const id = req.user?.id;
    if (!id) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return id;
  }
}
