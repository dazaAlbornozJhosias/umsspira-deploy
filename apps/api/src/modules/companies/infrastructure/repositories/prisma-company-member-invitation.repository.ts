import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import {
  REGISTRATION_SECURITY,
  type RegistrationSecurity,
} from '../../../registrations/application/ports/registration-security.port';
import type {
  CompanyMemberInvitationRepository,
  MemberInvitationResult,
  NewCompanyMemberInvitation,
} from '../../application/ports/company-member-invitation-repository.port';

@Injectable()
export class PrismaCompanyMemberInvitationRepository implements CompanyMemberInvitationRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REGISTRATION_SECURITY) private readonly security: RegistrationSecurity,
  ) {}

  async findCompanyName(companyId: string): Promise<string | null> {
    const company = await this.prisma.empresa.findUnique({
      where: { id: companyId },
      select: { razon_social: true },
    });
    return company ? (company.razon_social ?? '') : null;
  }

  async create(input: NewCompanyMemberInvitation): Promise<MemberInvitationResult> {
    try {
      return await this.prisma.$transaction(async (tx): Promise<MemberInvitationResult> => {
        // Serializa las invitaciones de esta empresa y evita duplicados concurrentes.
        const [company] = await tx.$queryRaw<{ id_usuario: string | null }[]>`
          SELECT id_usuario FROM public.empresa WHERE id = ${input.companyId}::uuid FOR UPDATE
        `;
        if (!company) {
          return { status: 'company_not_found' };
        }
        if (company.id_usuario !== input.actorId) {
          const admins = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM public.empresa_usuario
            WHERE id_empresa = ${input.companyId}::uuid AND id_usuario = ${input.actorId}::uuid
              AND rol = 'administrador' AND estado = 'activo' FOR SHARE
          `;
          if (admins.length === 0) {
            return { status: 'forbidden' };
          }
        }
        const existing = await tx.usuario.findFirst({
          where: { correo: { equals: input.email, mode: 'insensitive' } },
          select: {
            empresa_usuario_registros: {
              where: { id_empresa: input.companyId },
              select: { id: true },
            },
          },
        });
        if (existing) {
          return {
            status:
              existing.empresa_usuario_registros.length > 0 ? 'already_member' : 'email_in_use',
          };
        }
        const pending = await tx.empresaInvitacion.findFirst({
          where: {
            id_empresa: input.companyId,
            correo: { equals: input.email, mode: 'insensitive' },
            estado: 'pendiente',
            expira_en: { gt: input.createdAt },
          },
          select: { id: true },
        });
        if (pending) {
          return { status: 'pending' };
        }
        await tx.empresaInvitacion.updateMany({
          where: {
            id_empresa: input.companyId,
            correo: { equals: input.email, mode: 'insensitive' },
            estado: 'pendiente',
            expira_en: { lte: input.createdAt },
          },
          data: { estado: 'cancelada' },
        });
        const invitation = await tx.empresaInvitacion.create({
          data: {
            id_empresa: input.companyId,
            nombre: input.name,
            correo: input.email,
            rol: input.role,
            token_hash: input.tokenHash,
            creado_por: input.actorId,
            creado_en: input.createdAt,
            expira_en: input.expiresAt,
          },
          select: { id: true },
        });
        await tx.correoPendiente.create({
          data: {
            contenido: this.security.seal(input.mail),
            expira_en: new Date(input.createdAt.getTime() + 86400000),
          },
        });
        return { status: 'created', invitationId: invitation.id };
      });
    } catch (error) {
      // El índice parcial también protege frente al otro flujo de invitaciones.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { status: 'pending' };
      }
      throw error;
    }
  }
}
