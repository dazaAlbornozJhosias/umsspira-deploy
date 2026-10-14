import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { UserRole } from '@umsspira/shared-types';
import { ForbiddenError } from '../errors';
import { RolesGuard } from './roles.guard';

function contextWith(user?: { role: UserRole }): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardRequiring(roles?: UserRole[]): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('permite el acceso si el endpoint no exige roles', () => {
    expect(guardRequiring(undefined).canActivate(contextWith())).toBe(true);
  });

  it('permite el acceso si el rol del usuario está entre los exigidos', () => {
    const guard = guardRequiring(['administrador']);
    expect(guard.canActivate(contextWith({ role: 'administrador' }))).toBe(true);
  });

  it('deniega el acceso a un titulado en un endpoint de administrador (CA-05.5)', () => {
    const guard = guardRequiring(['administrador']);
    expect(() => guard.canActivate(contextWith({ role: 'titulado' }))).toThrow(ForbiddenError);
  });

  it('deniega el acceso si no hay usuario en la petición', () => {
    const guard = guardRequiring(['administrador']);
    expect(() => guard.canActivate(contextWith())).toThrow(ForbiddenError);
  });
});