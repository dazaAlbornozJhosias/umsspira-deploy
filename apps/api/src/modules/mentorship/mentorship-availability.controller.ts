import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { MentorAvailability } from './mentorship-availability.model';
import { MentorshipAvailabilityService } from './mentorship-availability.service';
import { MentorAuthGuard } from './mentor-test-auth.guard';

/** Se asume que el guard de autenticación del equipo inyecta req.user.id. */
type AuthenticatedRequest = Request & { user?: { id?: string } };

// TODO: aplicar el guard de autenticación del proyecto a nivel de clase:
// @UseGuards(AuthGuard)
// Mientras tanto, mismo guard de prueba que el resto del módulo (solo desarrollo).
@UseGuards(MentorAuthGuard)
@Controller('mentorship')
export class MentorshipAvailabilityController {
  constructor(private readonly availabilityService: MentorshipAvailabilityService) {}

  /** GET /mentorship/availability */
  @Get('availability')
  getAvailability(@Req() req: AuthenticatedRequest): Promise<MentorAvailability> {
    return this.availabilityService.getAvailability(this.userId(req));
  }

  /** PATCH /mentorship/availability */
  @Patch('availability')
  setAvailability(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<MentorAvailability> {
    return this.availabilityService.setAvailability(this.userId(req), dto);
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
