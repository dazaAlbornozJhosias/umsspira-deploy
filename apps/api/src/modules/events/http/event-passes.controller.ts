
import { Controller, Post, Param, Get, Req } from '@nestjs/common';

import { GenerateEventPassService } from '../application/generate-event-pass.service';
import { ListUserPassesService } from '../application/list-user-passes.service';

import type { AuthRequest } from '../../../shared/http/auth/contracts/auth-request';
import { AccessError } from '../../../shared/security/errors/access-error';

@Controller('registrations')
export class EventPassesController {
  constructor(
    private readonly generateEventPassService: GenerateEventPassService,
    private readonly listUserPassesService: ListUserPassesService,
  ) {}

  // Generar pase QR para una inscripción.
  @Post(':inscripcionId/pass')
  async generatePass(
    @Param('inscripcionId') inscripcionId: string,
    @Req() request: AuthRequest,
  ) {
    const usuarioTitularId = request.auth?.actor.id;

    if (!usuarioTitularId) {
      throw new AccessError('UNAUTHENTICATED');
    }

    return this.generateEventPassService.execute(
      inscripcionId,
      usuarioTitularId,
    );
  }

  // HU-7.11: Consultar los pases QR del usuario autenticado.
  @Get('my-passes')
  async listMyPasses(@Req() request: AuthRequest) {
    const usuarioTitularId = request.auth?.actor.id;

    if (!usuarioTitularId) {
      throw new AccessError('UNAUTHENTICATED');
    }

    return this.listUserPassesService.execute(usuarioTitularId);
  }
}
