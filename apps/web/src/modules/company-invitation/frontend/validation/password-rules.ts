export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordRule {
  id: 'length' | 'uppercase' | 'lowercase' | 'number';
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
    test: (password) => password.length >= MIN_PASSWORD_LENGTH,
  },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (password) => /[A-Z]/.test(password) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (password) => /[a-z]/.test(password) },
  { id: 'number', label: 'Un número', test: (password) => /\d/.test(password) },
];

export interface PasswordFormErrors {
  password?: string;
  confirmPassword?: string;
}

export function validatePasswordForm(password: string, confirmPassword: string): PasswordFormErrors {
  const errors: PasswordFormErrors = {};

  if (!password) {
    errors.password = 'Este campo es obligatorio.';
  } else {
    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
    if (failedRule) {
      errors.password = `La contraseña debe tener: ${failedRule.label.toLowerCase()}.`;
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Este campo es obligatorio.';
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}