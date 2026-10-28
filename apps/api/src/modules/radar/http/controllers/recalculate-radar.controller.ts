import { Controller, Post, Request, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { RecalculateRadarUseCase } from '../../application/use-cases/recalculate-radar.use-case';
import { PROFILE_TEXT_READER_PORT, ProfileTextReaderPort } from '../../application/ports/profile-text-reader.port';
import { ALGORITHM_VERSION } from '../../domain/policies/affinity-config';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';

@Controller('radar')
export class RecalculateRadarController {
  constructor(
    private readonly recalculateRadarUseCase: RecalculateRadarUseCase,
    @Inject(PROFILE_TEXT_READER_PORT)
    private readonly profileTextReader: ProfileTextReaderPort,
  ) {}

  @Post('recalculate')
  @RequirePermissions('radar:self:write') // Permiso exigido por el doc (Sección 12.5)
  async recalculate(@Request() req: { user: { id: string } }) {
    const tituladoId = req.user.id;

    // 1. Leer los textos actuales directamente en el backend
    const profileTexts = await this.profileTextReader.getProfileTexts(tituladoId);

    // 2. Normalizar y ordenar para el cálculo del hash
    const textToHash = profileTexts.texts
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .sort()
      .join('|');

    // 3. Generar el nuevo hash con la versión del algoritmo
    const currentHash = createHash('sha256')
      .update(`${ALGORITHM_VERSION}|${textToHash}`)
      .digest('hex');

    // 4. Mandar a ejecutar el caso de uso que armaste. 
    // Éste se encargará del bloqueo (advisory lock), comprobar idempotencia y guardar.
    return await this.recalculateRadarUseCase.execute(tituladoId, currentHash, profileTexts.texts);
  }
}