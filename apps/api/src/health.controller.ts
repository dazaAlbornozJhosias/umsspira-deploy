import { Controller, Get } from '@nestjs/common';
import { query } from './shared/lib/database';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    await query('SELECT 1');
    return { status: 'ok' };
  }
}