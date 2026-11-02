import { checkInitialAccounts, MAX_INITIAL_ACCOUNTS } from './company-registration.policy';

const admin = { email: 'admin@empresa.com', role: 'administrador' as const };
const recruiter = { email: 'rrhh@empresa.com', role: 'reclutador' as const };

describe('checkInitialAccounts', () => {
  it('acepta un administrador con reclutadores', () => {
    expect(checkInitialAccounts([admin, recruiter])).toBeNull();
  });

  it('rechaza la lista vacía', () => {
    expect(checkInitialAccounts([])).toBe('empty');
  });

  it('exige al menos un administrador', () => {
    expect(checkInitialAccounts([recruiter])).toBe('no_admin');
  });

  it('rechaza correos repetidos', () => {
    expect(checkInitialAccounts([admin, { ...admin, role: 'reclutador' }])).toBe('duplicated_email');
  });

  it('limita la cantidad de cuentas', () => {
    const accounts = Array.from({ length: MAX_INITIAL_ACCOUNTS + 1 }, (_, index) => ({
      email: `user${index}@empresa.com`,
      role: 'administrador' as const,
    }));
    expect(checkInitialAccounts(accounts)).toBe('too_many');
  });
});