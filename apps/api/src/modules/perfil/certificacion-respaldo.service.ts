import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { supabaseClient } from '../../shared/lib/supabase';
import { BUCKET_RESPALDOS, TipoRespaldo } from './perfil.constants';
import { Respaldo } from './perfil.mappers';
import { PerfilRepository } from './perfil.repository';

// T1.9: sube el respaldo de una certificación a Supabase Storage y lo registra en la BD
export class CertificacionRespaldoService {
  constructor(private readonly repositorio: PerfilRepository) {}

  async subir(
    tituladoId: string,
    certificacionId: string,
    archivo?: Express.Multer.File,
  ): Promise<Respaldo> {
    if (!archivo) {
      throw new BadRequestException('El archivo de respaldo es obligatorio');
    }

    const certificacion = await this.repositorio.obtenerPorId('certificaciones', certificacionId);
    if (!certificacion) {
      throw new NotFoundException('La certificación no existe');
    }
    if (certificacion.idTitulado !== tituladoId) {
      throw new ForbiddenException('La certificación no pertenece al titulado');
    }

    // Solo se aceptan JPG (lo valida ArchivoRespaldoPipe), así que el respaldo siempre se guarda como FOTO
    const tipo: TipoRespaldo = 'FOTO';
    const nombre = archivo.originalname.toLowerCase().replace(/[^a-z0-9.]+/g, '_');
    const archivoKey = `${tituladoId}/${certificacionId}/${Date.now()}_${nombre}`;

    const { error } = await supabaseClient()
      .storage.from(BUCKET_RESPALDOS)
      .upload(archivoKey, archivo.buffer, { contentType: archivo.mimetype });
    if (error) {
      throw new InternalServerErrorException('No se pudo subir el archivo de respaldo');
    }

    return this.repositorio.guardarRespaldo(certificacionId, tipo, archivoKey);
  }
}