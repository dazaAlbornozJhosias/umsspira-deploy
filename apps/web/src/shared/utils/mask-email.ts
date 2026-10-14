/**
 * Enmascara un correo para mostrarlo en pantalla.
 * Ejemplo: juanperez@gmail.com -> ju****z@gmail.com
 */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return "****";
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (local.length <= 4) {
    return `${local[0]}****@${domain}`;
  }

  return `${local.slice(0, 2)}****${local.slice(-1)}@${domain}`;
}