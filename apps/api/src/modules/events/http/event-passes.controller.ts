import { Controller, Post, Param, Req, Get } from '@nestjs/common';
import { GenerateEventPassService } from '../application/generate-event-pass.service';
import { ListUserPassesService } from '../application/list-user-passes.service';
@Controller('registrations')
export class EventPassesController {
  constructor(private readonly generateEventPassService: GenerateEventPassService,
              private readonly listUserPassesService: ListUserPassesService,
  ) {}

  // Ruta: POST /api/v1/registrations/:inscripcionId/pass
  @Post(':inscripcionId/pass')
  async generatePass(
    @Param('inscripcionId') inscripcionId: string,
    @Req() req: { user?: { id?: string } }
  ) {
    // El ID del usuario normalmente viene del token JWT de autenticación (req.user.id).
    // Ajusta esto según cómo manejen la sesión en el equipo.
    const usuarioTitularId = req.user?.id || 'ID_TEMPORAL_PARA_PRUEBAS'; 

    return this.generateEventPassService.execute(inscripcionId, usuarioTitularId);
  }
  // CA 5: Nueva ruta para consultar los pases vigentes/vencidos
  @Get('my-passes')
  async listMyPasses(@Req() req: { user?: { id?: string } }) {
    const usuarioTitularId = req.user?.id || 'ID_TEMPORAL_PARA_PRUEBAS';
    return this.listUserPassesService.execute(usuarioTitularId);
  }
}