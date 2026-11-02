import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CurrentActor } from '../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../shared/http/auth/decorators/require-permissions.decorator';

import type { ActorContext } from '../../shared/security/contexts/actor-context';

import { CompanyUsersService } from './company-users.service';
import { InviteCompanyMemberUseCase } from './application/use-cases/invite-company-member.use-case';
import { inviteCompanyMemberSchema } from './http/schemas/company-invitation.schemas';
import { ZodValidationPipe } from '../../shared/http/pipes/zod-validation.pipe';

// Roles permitidos por la base de datos
export type RolEmpresa = 'Administrador' | 'Reclutador';

// Estados permitidos
export type EstadoUsuarioEmpresa = 'Activo' | 'Inactivo';

// Datos para invitar un usuario
export interface InvitarUsuarioDto {
  nombre: string;
  correo: string;
  rol: RolEmpresa;
}

// Datos para actualizar un usuario
export interface ActualizarUsuarioDto {
  rol?: RolEmpresa;
  estado?: EstadoUsuarioEmpresa;
}

@Controller('companies')
export class CompanyUsersController {
  constructor(
    private readonly companyUsersService: CompanyUsersService,
    private readonly inviteMember: InviteCompanyMemberUseCase,
  ) {}

  // HU-03: Listar usuarios de una empresa
  @Get(':companyId/users')
  @RequirePermissions('empresas:self:read')
  async listarUsuarios(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    const usuarios = await this.companyUsersService.listarUsuarios(actor, companyId);

    return {
      data: usuarios,
    };
  }

  // HU-03: Invitar un usuario
  @Post(':companyId/users/invitations')
  @RequirePermissions('empresas:self:read')
  async invitarUsuario(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body(new ZodValidationPipe(inviteCompanyMemberSchema)) datos: InvitarUsuarioDto,
  ) {
    return { data: await this.inviteMember.execute(actor, companyId, datos) };
  }

  // HU-03: Modificar rol o estado de un colaborador
  @Patch(':companyId/users/:memberId')
  @RequirePermissions('empresas:self:read')
  async actualizarUsuario(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() datos: ActualizarUsuarioDto,
  ) {
    if (!datos || typeof datos !== 'object') {
      throw new BadRequestException('Debes proporcionar los datos del usuario');
    }

    if (datos.rol === undefined && datos.estado === undefined) {
      throw new BadRequestException('Debes indicar un rol o un estado');
    }

    if (datos.rol !== undefined && datos.rol !== 'Administrador' && datos.rol !== 'Reclutador') {
      throw new BadRequestException('El rol debe ser Administrador o Reclutador');
    }

    if (datos.estado !== undefined && datos.estado !== 'Activo' && datos.estado !== 'Inactivo') {
      throw new BadRequestException('El estado debe ser Activo o Inactivo');
    }

    const usuario = await this.companyUsersService.actualizarUsuario(
      actor,
      companyId,
      memberId,
      datos,
    );

    return {
      data: usuario,
    };
  }
  @Delete(':companyId/users/invitations/:invitationId')
  @RequirePermissions('empresas:self:read')
  async cancelarInvitacion(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    await this.companyUsersService.cancelarInvitacion(actor, companyId, invitationId);
    return { data: { message: 'Invitación cancelada' } };
  }
}
