import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Req,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';

import { perfilValidationPipe } from './perfil.pipe';
import { CrearCertificacionDto } from './dto/crear-certificacion.dto';
import { CrearExperienciaLaboralDto } from './dto/crear-experiencia-laboral.dto';
import { CrearFormacionAcademicaDto } from './dto/crear-formacion-academica.dto';
import { Seccion, esSeccion } from './perfil.constants';
import { Registro } from './perfil.mappers';
import { PerfilRepository } from './perfil.repository';
import { obtenerTituladoId } from './titulado-actual';
import {
  FormacionComparable,
  MENSAJE_FORMACION_DUPLICADA,
  esFormacionDuplicada,
} from './validators/formacion-duplicada';

// T4.4: al editar se aplican las mismas reglas que al crear (los mismos DTOs de HU2)
const DTO_POR_SECCION: Record<Seccion, new () => object> = {
  'formacion-academica': CrearFormacionAcademicaDto,
  'experiencia-laboral': CrearExperienciaLaboralDto,
  'certificaciones': CrearCertificacionDto,
};

// Mismas opciones que el ValidationPipe global (main.ts): el formato del error 400 es idéntico al de crear
const validador = new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true });

@Controller('api/v1/perfil')
@UsePipes(perfilValidationPipe())
export class PerfilRegistrosController {
  constructor(private readonly perfilRepository: PerfilRepository) {}

  @Get(':seccion/:id')
  async obtenerRegistro(
    @Param('seccion') seccionParam: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.obtenerRegistroPropio(seccionParam, id, req);
  }

  // T4.2: actualiza el registro existente, sin crear otro
  @Put(':seccion/:id')
  async actualizarRegistro(
    @Param('seccion') seccionParam: string,
    @Param('id') id: string,
    @Body() datos: object,
    @Req() req: Request,
  ) {
    const registro = await this.obtenerRegistroPropio(seccionParam, id, req);
    const seccion = seccionParam as Seccion;

    // 400 por campo, con el mismo formato que al crear
    const validados = (await validador.transform(datos ?? {}, {
      type: 'body',
      metatype: DTO_POR_SECCION[seccion],
    })) as Record<string, unknown>;

    if (seccion === 'formacion-academica') {
      // 409: otra formación del mismo titulado ya tiene Institución, Título y Año (el propio registro no cuenta)
      const existentes = (await this.perfilRepository.listar(
        seccion,
        registro.idTitulado,
      )) as unknown as FormacionComparable[];
      if (esFormacionDuplicada(validados as unknown as FormacionComparable, existentes, registro.id)) {
        throw new ConflictException(MENSAJE_FORMACION_DUPLICADA);
      }
    }

    // Sin fecha de fin = trabajo actual: se limpia la fecha anterior en vez de conservarla
    if (seccion === 'experiencia-laboral') {
      validados.fechaFin = validados.fechaFin ?? null;
    }

    return this.perfilRepository.actualizar(seccion, registro.id, validados);
  }

  // T4.3: elimina el registro; 404 si no existe
  @Delete(':seccion/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarRegistro(
    @Param('seccion') seccionParam: string,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<void> {
    const registro = await this.obtenerRegistroPropio(seccionParam, id, req);
    await this.perfilRepository.eliminar(seccionParam as Seccion, registro.id);
  }

  // 404 si la sección o el registro no existen; 403 si el registro es de otro titulado
  private async obtenerRegistroPropio(
    seccionParam: string,
    id: string,
    req: Request,
  ): Promise<Registro> {
    if (!esSeccion(seccionParam)) {
      throw new NotFoundException('La sección solicitada no existe');
    }

    const registro = await this.perfilRepository.obtenerPorId(
      seccionParam,
      id,
    );

    if (!registro) {
      throw new NotFoundException('El registro no existe');
    }

    const tituladoId = await obtenerTituladoId(req);

    if (registro.idTitulado !== tituladoId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este registro',
      );
    }

    return registro;
  }
}
