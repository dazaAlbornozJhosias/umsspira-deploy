import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';
import { HeaderResponseDto } from './dto/header-response.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ContactResponseDto } from './dto/contact-response.dto';

@Controller('api/empresa/perfil')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * TSK-2.3: Obtener datos del encabezado del perfil corporativo.
   */
  @Get('header')
  async getHeader(
    @CurrentUser('empresaId') empresaId: string,
  ): Promise<HeaderResponseDto> {
    return this.companiesService.getHeader(empresaId);
  }

   /**
   * TSK-4.6 + TSK-4.7: Actualizar perfil corporativo.
   * Bloquea modificacion de NIT/RUC.
   */
  @Put()
  async updateProfile(
    @CurrentUser('empresaId') empresaId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateProfile(empresaId, dto);
  }
    /**
   * TSK-3.4: Obtener datos de contacto y detalles institucionales.
   * Ruta: GET /api/empresa/perfil/contacto
   */
  @Get('contacto')
  async getContact(
    @CurrentUser('empresaId') empresaId: string,
  ): Promise<ContactResponseDto> {
    return this.companiesService.getContact(empresaId);
  }
}