import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { CompanyProfileRepository } from '../../application/ports/company-profile-repository.port';
import type { UpdateCompanyProfileInput } from '../../application/contracts/update-company-profile.input';
import {
  companyHeaderSelect,
  companyContactSelect,
  companyProfileSelect,
  toCompany,
  toCompanyHeader,
  toCompanyContact,
  toCompanyUpdate,
} from '../translators/company.translator';

@Injectable()
export class PrismaCompanyProfileRepository implements CompanyProfileRepository {
  constructor(private readonly prisma: PrismaService) {}
  
  async findHeader(companyId: string, _ownerId: string) {
    const record = await this.prisma.empresa.findUnique({
      where: { id: companyId },
      select: companyHeaderSelect,
    });
    return record ? toCompanyHeader(record) : null;
  }

  async findContact(companyId: string, _ownerId: string) {
    const record = await this.prisma.empresa.findUnique({
      where: { id: companyId },
      select: companyContactSelect,
    });
    return record ? toCompanyContact(record) : null;
  }

  async updateProfile(
    companyId: string,
    ownerId: string,
    input: UpdateCompanyProfileInput,
    now: Date,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const record = await tx.empresa.update({
            where: { id: companyId, id_usuario: ownerId },
            data: toCompanyUpdate(input, now),
            select: companyProfileSelect,
          });

          if (input.telefono !== undefined) {
            const phone = await tx.telefonoEmpresa.findFirst({
              where: { id_empresa: companyId, tipo: 'PRINCIPAL' },
              select: { id: true },
              orderBy: { id: 'asc' },
            });
            if (phone) {
              await tx.telefonoEmpresa.update({
                where: { id: phone.id },
                data: { numero: input.telefono },
              });
            } else {
              await tx.telefonoEmpresa.create({
                data: { id_empresa: companyId, tipo: 'PRINCIPAL', numero: input.telefono },
              });
            }
          }

          if (input.direccion !== undefined) {
            const address = await tx.direccionEmpresa.findFirst({
              where: { id_empresa: companyId },
              select: { id: true },
              orderBy: { id: 'asc' },
            });
            if (address) {
              await tx.direccionEmpresa.update({
                where: { id: address.id },
                data: { direccion: input.direccion },
              });
            } else {
              await tx.direccionEmpresa.create({
                data: { id_empresa: companyId, direccion: input.direccion },
              });
            }
          }
          return toCompany(record);
        },
        { timeout: 15_000 },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
