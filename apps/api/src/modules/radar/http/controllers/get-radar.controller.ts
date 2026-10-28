import { Controller, Get, Request } from '@nestjs/common';
import { GetRadarUseCase } from '../../application/use-cases/get-radar.use-case';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
// Importa el decorador oficial de permisos de tu proyecto (ajusta la ruta si es necesario) 

@Controller('radar')
export class GetRadarController {
  constructor(private readonly getRadarUseCase: GetRadarUseCase) {}

  @Get()
  @RequirePermissions('radar:self:read') // Permiso exigido por el doc (Sección 12.5)
  async getRadar(@Request() req: { user: { id: string } }) {
    // El ID del titulado se extrae directamente del token JWT por seguridad,
    // garantizando que un usuario no pueda ver el radar de otro.
    const tituladoId = req.user.id; 
    
    return await this.getRadarUseCase.execute(tituladoId);
  }
}