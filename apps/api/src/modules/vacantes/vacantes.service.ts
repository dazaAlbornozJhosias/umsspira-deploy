import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';

export interface UpdateVacanteData {
  titulo?: string;
  modalidad?: string;
  nivel_experiencia?: string;
  descripcion_tecnica?: string;
  estado?: string; // <-- NUEVO: para poder pausar
}

@Injectable()
export class VacantesService {
  constructor(private prisma: PrismaService) {}

  async obtenerMisVacantes(idUsuario: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id_usuario: idUsuario }
    });

    if (!empresa) {return [];}

    return this.prisma.vacante.findMany({
      where: { id_empresa: empresa.id },
      orderBy: { created_at: 'desc' }
    });
  }

  async obtenerVacantePorId(idVacante: string, idUsuario: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id_usuario: idUsuario }
    });

    if (!empresa) {throw new Error('Empresa no encontrada');}

    return this.prisma.vacante.findFirst({
      where: { id: idVacante, id_empresa: empresa.id }
    });
  }

  async cerrarVacante(idVacante: string) {
    return this.prisma.vacante.update({
      where: { id: idVacante },
      data: { estado: 'CERRADA' }
    });
  }

  async actualizarVacante(idVacante: string, idUsuario: string, data: UpdateVacanteData) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id_usuario: idUsuario }
    });

    if (!empresa) {throw new Error('Empresa no encontrada');}

    const vacante = await this.prisma.vacante.findFirst({
      where: { id: idVacante, id_empresa: empresa.id }
    });

    if (!vacante) {throw new Error('Vacante no encontrada o sin permiso');}

    return this.prisma.vacante.update({
      where: { id: idVacante },
      data: {
        titulo: data.titulo,
        modalidad: data.modalidad,
        nivel_experiencia: data.nivel_experiencia,
        descripcion_tecnica: data.descripcion_tecnica,
        estado: data.estado, // <-- NUEVO
      }
    });
  }

  // NUEVO MÉTODO PARA ELIMINAR
  async eliminarVacante(idVacante: string, idUsuario: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id_usuario: idUsuario }
    });

    if (!empresa) {throw new Error('Empresa no encontrada');}

    const vacante = await this.prisma.vacante.findFirst({
      where: { id: idVacante, id_empresa: empresa.id }
    });

    if (!vacante) {throw new Error('Vacante no encontrada o sin permiso para eliminarla');}

    return this.prisma.vacante.delete({
      where: { id: idVacante }
    });
  }
}