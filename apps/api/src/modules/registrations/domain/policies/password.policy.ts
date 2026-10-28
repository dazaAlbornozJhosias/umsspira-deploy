// Política de contraseña de HU-06 (CA-06.3): 8 a 128 caracteres con mayúscula,
// minúscula, número y símbolo.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_POLICY_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo';

export function meetsPasswordPolicy(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    /\p{Lu}/u.test(password) &&
    /\p{Ll}/u.test(password) &&
    /\d/.test(password) &&
    /[^\p{L}\p{N}\s]/u.test(password)
  );
}