import { Controller, Get, Req, UsePipes } from '@nestjs/common';
import { Request } from 'express';
import { perfilValidationPipe } from './perfil.pipe';
import { PerfilResumenService, PerfilResumen } from './perfil-resumen.service';
import { PerfilRepository } from './perfil.repository';
import { obtenerTituladoId } from './titulado-actual';

// HU3 (T3.1): solo ese grupo edita este archivo
@Controller('api/v1/perfil')
@UsePipes(perfilValidationPipe())
export class PerfilResumenController {
  private readonly servicio: PerfilResumenService;

  constructor(repositorio: PerfilRepository) {
    this.servicio = new PerfilResumenService(repositorio);
  }

  // GET /api/v1/perfil -> perfil del titulado con sus 3 secciones
  @Get()
  async obtenerPerfil(@Req() req: Request): Promise<PerfilResumen> {
    const tituladoId = await obtenerTituladoId(req);
    return this.servicio.obtenerResumen(tituladoId);
  }
}
