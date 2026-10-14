import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UpdateMentorAreasDto } from './dto/update-mentor-areas.dto';
import { UpdateMentorProfileInformationDto } from './dto/update-mentor-profile-information.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';
import { Mentor } from './mentor.model';
import {
  MentorAreasState,
  MentorProfileInformationState,
  MentorshipService,
  ModuleStatus,
} from './mentorship.service';
import { MentorAuthGuard } from './mentor-test-auth.guard';

/** Se asume que el guard de autenticación del equipo inyecta req.user.id. */
type AuthenticatedRequest = Request & { user?: { id?: string } };

// TODO: aplicar el guard de autenticación del proyecto a nivel de clase:
// @UseGuards(AuthGuard)
@Controller('mentorship')
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  @Get('status')
  getStatus(): Promise<ModuleStatus> {
    return this.mentorshipService.getStatus();
  }

  @Get('profiles')
  getProfiles(): Promise<Mentor[]> {
    return this.mentorshipService.getActiveProfiles();
  }

  @Get('my-profile')
  @UseGuards(MentorAuthGuard)
  getMyProfile(@Req() req: AuthenticatedRequest): Promise<Mentor> {
    return this.mentorshipService.getMyProfile(this.userId(req));
  }

  @Get('my-profile/information')
  @UseGuards(MentorAuthGuard)
  getMyProfileInformation(
    @Req() req: AuthenticatedRequest,
  ): Promise<MentorProfileInformationState> {
    return this.mentorshipService.getMyProfileInformation(this.userId(req));
  }

  @Patch('my-profile/information')
  @UseGuards(MentorAuthGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  )
  updateMyProfileInformation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateMentorProfileInformationDto,
  ): Promise<MentorProfileInformationState> {
    return this.mentorshipService.updateMyProfileInformation(this.userId(req), dto);
  }

  @Delete('my-profile/information')
  @UseGuards(MentorAuthGuard)
  deleteMyProfileInformation(
    @Req() req: AuthenticatedRequest,
  ): Promise<MentorProfileInformationState> {
    return this.mentorshipService.deleteMyProfileInformation(this.userId(req));
  }

  @Post('profiles/reset')
  @HttpCode(HttpStatus.OK)
  resetMyProfile(@Req() req: AuthenticatedRequest): Promise<Mentor> {
    return this.mentorshipService.resetMyProfile(this.userId(req));
  }

  @Post('eligibility')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MentorAuthGuard)
  checkEligibility(@Req() req: AuthenticatedRequest): Promise<{ eligible: boolean }> {
    return this.mentorshipService.checkEligibility(this.userId(req));
  }

  @Patch('my-profile/participation')
  @UseGuards(MentorAuthGuard)
  setParticipation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateParticipationDto,
  ): Promise<Mentor> {
    return this.mentorshipService.setParticipation(this.userId(req), dto);
  }

  // Areas tecnicas configuradas por el mentor autenticado.
  @Get('my-profile/areas')
  @UseGuards(MentorAuthGuard)
  getMyAreas(@Req() req: AuthenticatedRequest): Promise<MentorAreasState> {
    return this.mentorshipService.getMyAreas(this.userId(req));
  }

  @Patch('my-profile/areas')
  @UseGuards(MentorAuthGuard)
  updateMyAreas(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateMentorAreasDto,
  ): Promise<MentorAreasState> {
    return this.mentorshipService.updateMyAreas(this.userId(req), dto);
  }

  // TODO: restringir a administradores con el guard de roles del proyecto.
  // Mientras tanto exige autenticacion: sin este guard el endpoint quedaba
  // abierto a cualquiera para desactivar cualquier mentor.
  @UseGuards(MentorAuthGuard)
  @Patch('deactivate/:userId')
  deactivate(@Param('userId', ParseUUIDPipe) userId: string): Promise<Mentor> {
    return this.mentorshipService.deactivateByAdmin(userId);
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
