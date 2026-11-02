import { INVITATION_VALIDITY_DAYS } from '../../application/security/invitation-token';

// Plantilla del correo de invitación a empresas (HU-01, CA-01 a CA-05).
// Los correos no admiten Tailwind: se usan estilos en línea y tablas.

export interface CompanyInvitationEmailInput {
  companyName: string;
  activationUrl: string;
  logoUrl?: string;
}

export interface CompanyInvitationEmail {
  subject: string;
  text: string;
  html: string;
}

const COLORS = {
  primary: '#FFB162',
  title: '#1B2632',
  text: '#2C3B4D',
  muted: '#6B7280',
  border: '#E5E7EB',
  background: '#EEE9DF',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildCompanyInvitationEmail({
  companyName,
  activationUrl,
  logoUrl,
}: CompanyInvitationEmailInput): CompanyInvitationEmail {
  const subject = '¡Estás invitado a unirte a UMSSPIRA!';
  const validity = `Este enlace es válido por ${INVITATION_VALIDITY_DAYS} días.`;

  const text = [
    'Hola,',
    '',
    `Tu empresa ${companyName} ha sido invitada a formar parte de UMSSPIRA como empresa empleadora.`,
    '',
    'Para activar tu cuenta y configurar tu contraseña inicial, abre el siguiente enlace (Activar mi cuenta):',
    activationUrl,
    '',
    validity,
    '',
    'Si no solicitaste esta invitación, puedes ignorar este correo.',
    'Equipo UMSSPIRA',
  ].join('\n');

  const safeCompany = escapeHtml(companyName);
  const safeUrl = escapeHtml(activationUrl);
  const logoCell = logoUrl
    ? `<td style="padding-right:10px;"><img src="${escapeHtml(logoUrl)}" width="40" height="40" alt="UMSSPIRA" style="display:block;border:0;border-radius:8px;"></td>`
    : '';
  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:${COLORS.background};font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid ${COLORS.border};border-radius:12px;">
            <tr>
              <td align="center" style="padding:32px 40px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    ${logoCell}
                    <td style="font-size:26px;font-weight:700;color:${COLORS.title};">UMSS<span style="color:${COLORS.primary};">PIRA</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 0;font-size:22px;font-weight:700;color:${COLORS.title};">${subject}</td>
            </tr>
            <tr>
              <td style="padding:16px 40px 0;font-size:14px;line-height:20px;color:${COLORS.text};">
                <p style="margin:0 0 12px;">Hola,</p>
                <p style="margin:0 0 12px;">Tu empresa ${safeCompany} ha sido invitada a formar parte de UMSSPIRA como empresa empleadora.</p>
                <p style="margin:0;">Para activar tu cuenta y configurar tu contraseña inicial, haz clic en el siguiente botón:</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0;">
                <a href="${safeUrl}" style="display:block;height:44px;line-height:44px;text-align:center;background:${COLORS.primary};color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Activar mi cuenta</a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 40px 0;font-size:12px;color:${COLORS.muted};">${validity}</td>
            </tr>
            <tr>
              <td style="padding:20px 40px 0;"><hr style="border:none;border-top:1px solid ${COLORS.border};margin:0;"></td>
            </tr>
            <tr>
              <td style="padding:16px 40px 32px;font-size:13px;line-height:20px;color:${COLORS.text};">
                <p style="margin:0 0 8px;">Si no solicitaste esta invitación, puedes ignorar este correo.</p>
                <p style="margin:0;font-weight:700;color:${COLORS.title};">Equipo UMSSPIRA</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}