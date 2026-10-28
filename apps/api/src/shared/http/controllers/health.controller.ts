import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HttpError } from '../errors/http-error';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async check(): Promise<{ status: 'ok'; database: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch {
      this.logger.warn('La comprobación de salud no pudo acceder a PostgreSQL');
      throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'La base de datos no está disponible');
    }
  }
}
