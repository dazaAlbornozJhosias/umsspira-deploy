import { ROLE_PERMISSIONS } from './access.policy';

describe('Política de acceso por rol', () => {
  it('asigna los permisos de NLP y Radar al titulado', () => {
    expect(ROLE_PERMISSIONS.titulado).toEqual(
      expect.arrayContaining(['nlp:extract', 'radar:self:read', 'radar:self:write']),
    );
  });

  it('asigna nlp:extract al administrador sin permisos de Radar', () => {
    expect(ROLE_PERMISSIONS.administrador).toContain('nlp:extract');
    expect(ROLE_PERMISSIONS.administrador).not.toContain('radar:self:read');
    expect(ROLE_PERMISSIONS.administrador).not.toContain('radar:self:write');
  });

  it('no asigna permisos de NLP ni Radar a la empresa', () => {
    expect(ROLE_PERMISSIONS.empresa).not.toContain('nlp:extract');
    expect(ROLE_PERMISSIONS.empresa).not.toContain('radar:self:read');
    expect(ROLE_PERMISSIONS.empresa).not.toContain('radar:self:write');
  });

  it('declara cada permiso una sola vez por rol', () => {
    for (const permissions of Object.values(ROLE_PERMISSIONS)) {
      expect(new Set(permissions).size).toBe(permissions.length);
    }
  });
});
