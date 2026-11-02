import {
  recoveryLinkSchema,
  recoveryPasswordSchema,
  recoveryRequestSchema,
  recoveryResetSchema,
} from './password-recovery.schema';

describe('esquemas de recuperación de contraseña', () => {
  describe('recoveryPasswordSchema (política compartida de HU-06)', () => {
    it.each(['Abcdef1!', 'Contraseña-segura-2026', 'ÁrbolVerde9#'])('acepta %s', (password) => {
      expect(recoveryPasswordSchema.safeParse(password).success).toBe(true);
    });

    it.each([
      ['corta', 'Ab1!'],
      ['sin mayúscula', 'abcdef1!'],
      ['sin minúscula', 'ABCDEFG1!'],
      ['sin número', 'Abcdefg!'],
      ['sin símbolo', 'Abcdefg1'],
      ['demasiado larga', `Aa1!${'x'.repeat(125)}`],
    ])('rechaza una contraseña %s', (_label, password) => {
      expect(recoveryPasswordSchema.safeParse(password).success).toBe(false);
    });
  });

  describe('recoveryRequestSchema', () => {
    it('normaliza el correo igual que el inicio de sesión', () => {
      const parsed = recoveryRequestSchema.parse({ email: '  Admin@UMSS.edu.bo ' });

      expect(parsed.email).toBe('admin@umss.edu.bo');
    });

    it('rechaza correos inválidos y campos desconocidos', () => {
      expect(recoveryRequestSchema.safeParse({ email: 'no-es-correo' }).success).toBe(false);
      expect(recoveryRequestSchema.safeParse({ email: 'a@b.co', role: 'administrador' }).success).toBe(false);
    });
  });

  it('el enlace exige un token y no acepta otros campos', () => {
    expect(recoveryLinkSchema.safeParse({ token: 'abc' }).success).toBe(true);
    expect(recoveryLinkSchema.safeParse({ token: '' }).success).toBe(false);
    expect(recoveryLinkSchema.safeParse({ token: 'abc', extra: 1 }).success).toBe(false);
  });

  it('restablecer exige token y una contraseña que cumpla la política', () => {
    expect(recoveryResetSchema.safeParse({ token: 'abc', password: 'Abcdef1!' }).success).toBe(true);
    expect(recoveryResetSchema.safeParse({ token: 'abc', password: 'debil' }).success).toBe(false);
    expect(recoveryResetSchema.safeParse({ password: 'Abcdef1!' }).success).toBe(false);
  });
});