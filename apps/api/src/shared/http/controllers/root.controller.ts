import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class RootController {
  @Get()
  @Public()
  info(): { service: string; description: string; web: string; health: string } {
    return {
      service: 'UMSSPIRA API',
      description: 'API de la Comunidad de Egresados UMSS',
      web: 'https://umsspira-sooty.vercel.app',
      health: '/health',
    };
  }
}
