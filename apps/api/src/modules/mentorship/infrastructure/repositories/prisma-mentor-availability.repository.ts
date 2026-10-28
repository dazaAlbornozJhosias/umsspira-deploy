import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { MentorAvailabilityRepository } from '../../application/ports/mentor-availability-repository.port';
import type { AvailabilityStatus } from '../../domain/entities/mentor';
import { canReceiveMentorship } from '../../domain/policies/mentor.policy';
import { toAvailability } from '../translators/mentor.translator';
import { availabilityOrder, lockOwnMentor } from './mentor-transaction';
import { requireOwnMentor } from './mentor-catalog-reader';

@Injectable()
export class PrismaMentorAvailabilityRepository implements MentorAvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async own(userId: string) {
    const mentor = await requireOwnMentor(this.prisma, userId, true);
    const row = await this.prisma.disponibilidadMentor.findFirst({
      where: { id_mentor: mentor.id },
      orderBy: availabilityOrder,
    });
    return toAvailability(row);
  }

  async update(userId: string, status: AvailabilityStatus) {
    return this.prisma.$transaction(
      async (tx) => {
        const mentor = await lockOwnMentor(tx, userId, true);
        const current = await tx.disponibilidadMentor.findFirst({
          where: { id_mentor: mentor.id },
          orderBy: availabilityOrder,
        });
        if (current?.estado === status) {
          return toAvailability(current);
        }
        const row = current
          ? await tx.disponibilidadMentor.update({
              where: { id: current.id },
              data: { estado: status, fecha_actualizacion: new Date() },
            })
          : await tx.disponibilidadMentor.create({
              data: {
                id_mentor: mentor.id,
                estado: status,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date(),
              },
            });
        return toAvailability(row);
      },
      { timeout: 15000 },
    );
  }

  async canReceiveRequests(mentorId: string): Promise<boolean> {
    const row = await this.prisma.mentor.findFirst({
      where: { id: mentorId, titulado: { usuario: { estado: 'ACTIVO', rol: 'titulado' } } },
      select: {
        esta_activo: true,
        disponibilidad_mentor_registros: { orderBy: availabilityOrder, take: 1 },
      },
    });
    return canReceiveMentorship(
      row?.esta_activo === true,
      toAvailability(row?.disponibilidad_mentor_registros[0]).status,
    );
  }
}
