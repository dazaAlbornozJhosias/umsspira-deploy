// Réplica de la política de contraseña del backend (HU-06, CA-06.3):
// 8 a 128 caracteres con mayúscula, minúscula, número y símbolo.
// Mantener sincronizada con apps/api/src/shared/security/policies/password.policy.ts.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Se construyen con RegExp porque el target de TypeScript de apps/web no admite el flag /u en literales.
const UPPERCASE = new RegExp("\\p{Lu}", "u");
const LOWERCASE = new RegExp("\\p{Ll}", "u");
const SYMBOL = new RegExp("[^\\p{L}\\p{N}\\s]", "u");

export interface PasswordRules {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  passwordsMatch: boolean;
  allValid: boolean;
}

export function evaluatePassword(password: string, confirmation: string): PasswordRules {
  const hasMinLength =
    password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  const hasUppercase = UPPERCASE.test(password);
  const hasLowercase = LOWERCASE.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = SYMBOL.test(password);
  const passwordsMatch = password.length > 0 && password === confirmation;

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    passwordsMatch,
    allValid:
      hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol && passwordsMatch,
  };
}