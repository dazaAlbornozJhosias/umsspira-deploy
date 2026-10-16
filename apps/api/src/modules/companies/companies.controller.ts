import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '@umsspira/shared-types';
import { AuthGuard, CurrentUser, RolesGuard } from '@/shared/guards';
import { Roles } from '@/shared/guards/roles.decorator';
import { CompaniesService } from './companies.service';
import { HeaderResponseDto } from './dto/header-response.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ContactResponseDto } from './dto/contact-response.dto';

// El login real devuelve el JWT de Supabase: se valida con AuthGuard
// (Supabase Auth) y no con el mecanismo local legacy (JwtAuthGuard),
// que rechaza esos tokens y dejaba a la empresa fuera de sus rutas.
@Controller('api/empresa/perfil')
@UseGuards(AuthGuard, RolesGuard)
@Roles('empresa')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * TSK-2.3: Obtener datos del encabezado del perfil corporativo.
   */
  @Get('header')
  async getHeader(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<HeaderResponseDto> {
    return this.companiesService.getHeader(user.id);
  }

   /**
   * TSK-4.6 + TSK-4.7: Actualizar perfil corporativo.
   * Bloquea modificacion de NIT/RUC.
   */
  @Put()
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateProfile(user.id, dto);
  }
    /**
   * TSK-3.4: Obtener datos de contacto y detalles institucionales.
   * Ruta: GET /api/empresa/perfil/contacto
   */
  @Get('contacto')
  async getContact(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ContactResponseDto> {
    return this.companiesService.getContact(user.id);
  }
}
