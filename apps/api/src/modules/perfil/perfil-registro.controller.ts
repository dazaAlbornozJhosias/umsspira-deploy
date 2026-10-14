import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { perfilValidationPipe } from './perfil.pipe';
import { CertificacionRespaldoService } from './certificacion-respaldo.service';
import { CrearCertificacionDto } from './dto/crear-certificacion.dto';
import { CrearExperienciaLaboralDto } from './dto/crear-experiencia-laboral.dto';
import { CrearFormacionAcademicaDto } from './dto/crear-formacion-academica.dto';
import { ExperienciaLaboralService } from './experiencia-laboral.service';
import { PerfilRegistroService } from './perfil-registro.service';
import { PerfilRepository } from './perfil.repository';
import { obtenerTituladoId } from './titulado-actual';
import { ArchivoRespaldoPipe } from './validators/archivo-respaldo.pipe';

// HU1: endpoints de guardado del formulario de perfil (T1.6 a T1.9)
@Controller('api/v1/perfil')
@UsePipes(perfilValidationPipe())
export class PerfilRegistroController {
  private readonly experienciaLaboral: ExperienciaLaboralService;
  private readonly respaldo: CertificacionRespaldoService;

  constructor(
    private readonly servicio: PerfilRegistroService,
    repositorio: PerfilRepository,
  ) {
    this.experienciaLaboral = new ExperienciaLaboralService(repositorio);
    this.respaldo = new CertificacionRespaldoService(repositorio);
  }

  // T1.6: POST /api/v1/perfil/formacion-academica
  @Post('formacion-academica')
  @HttpCode(201)
  async crearFormacion(@Req() req: Request, @Body() datos: CrearFormacionAcademicaDto) {
    const tituladoId = await obtenerTituladoId(req);
    return this.servicio.crearFormacion(tituladoId, datos);
  }

  // T1.7: POST /api/v1/perfil/experiencia-laboral -> 201 con la experiencia creada
  @Post('experiencia-laboral')
  async crearExperienciaLaboral(@Req() req: Request, @Body() datos: CrearExperienciaLaboralDto) {
    const tituladoId = await obtenerTituladoId(req);
    return this.experienciaLaboral.crear(tituladoId, datos);
  }

  // T1.8: POST /api/v1/perfil/certificaciones
  @Post('certificaciones')
  @HttpCode(201)
  async crearCertificacion(@Req() req: Request, @Body() datos: CrearCertificacionDto) {
    const tituladoId = await obtenerTituladoId(req);
    return this.servicio.crearCertificacion(tituladoId, datos);
  }

  // T1.9: POST /api/v1/perfil/certificaciones/:id/respaldo (campo "archivo") -> 201 con el respaldo
  @Post('certificaciones/:id/respaldo')
  @UseInterceptors(FileInterceptor('archivo'))
  async subirRespaldo(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(ArchivoRespaldoPipe) archivo?: Express.Multer.File,
  ) {
    const tituladoId = await obtenerTituladoId(req);
    return this.respaldo.subir(tituladoId, id, archivo);
  }
}