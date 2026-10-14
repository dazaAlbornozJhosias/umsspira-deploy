import { Controller, Get, Req, Res, UsePipes } from '@nestjs/common';
import { Request, Response } from 'express';
import { perfilValidationPipe } from './perfil.pipe';
import { PerfilExportarService } from './perfil-exportar.service';
import { PerfilRepository } from './perfil.repository';
import { obtenerTituladoId } from './titulado-actual';

// HU5 (T5.2 y T5.3): solo ese grupo edita este archivo
@Controller('api/v1/perfil')
@UsePipes(perfilValidationPipe())
export class PerfilExportarController {
  private readonly servicio: PerfilExportarService;

  constructor(repositorio: PerfilRepository) {
    this.servicio = new PerfilExportarService(repositorio);
  }

  // GET /api/v1/perfil/exportar-json -> descarga el perfil del titulado como archivo .json
  @Get('exportar-json')
  async exportarJson(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const tituladoId = await obtenerTituladoId(req);
    const { contenido, nombreArchivo } = await this.servicio.exportar(tituladoId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return contenido;
  }
}
