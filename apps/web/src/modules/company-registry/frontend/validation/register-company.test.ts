import { hasErrors, toRegisterCompanyPayload, validateRegisterCompany } from './register-company';

const valid = {
  companyName: 'TechSolutions S.A.',
  taxId: '1023456029',
  accounts: [{ email: 'Gerencia@Empresa.com ', role: 'administrador' as const }],
};

describe('validateRegisterCompany (US-1.4)', () => {
  it('acepta un formulario válido', () => {
    expect(hasErrors(validateRegisterCompany(valid))).toBe(false);
  });

  it('rechaza un NIT con letras o guiones', () => {
    expect(validateRegisterCompany({ ...valid, taxId: '12A-45' }).taxId).toBeDefined();
  });

  it('exige al menos un administrador', () => {
    const errors = validateRegisterCompany({
      ...valid,
      accounts: [{ email: 'rrhh@empresa.com', role: 'reclutador' }],
    });
    expect(errors.accounts).toBe('Al menos una cuenta debe tener el rol administrador');
  });

  it('marca correos inválidos y repetidos sin importar mayúsculas', () => {
    const errors = validateRegisterCompany({
      ...valid,
      accounts: [
        { email: 'a@empresa.com', role: 'administrador' },
        { email: 'A@EMPRESA.COM', role: 'reclutador' },
        { email: 'no-es-correo', role: 'reclutador' },
      ],
    });
    expect(errors.accountEmails).toEqual({ 1: 'Este correo ya está en la lista', 2: 'Correo no válido' });
  });

  it('normaliza los datos antes de enviarlos', () => {
    expect(toRegisterCompanyPayload(valid)).toEqual({
      companyName: 'TechSolutions S.A.',
      taxId: '1023456029',
      accounts: [{ email: 'gerencia@empresa.com', role: 'administrador' }],
    });
  });
});