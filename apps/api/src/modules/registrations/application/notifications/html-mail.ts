// Colores del sistema de diseño (tailwind.config.ts y mockup). Se escriben como valores
// sólidos porque los clientes de correo no soportan variables CSS ni transparencias.
const COLOR = {
  page: '#FAF6EE',
  frame: '#EEE9DF',
  frameLine: '#D9D2C5',
  card: '#FFFFFF',
  cardLine: '#E0D9CB',
  header: '#0F172A',
  accent: '#FFB162',
  ink: '#1B2632',
  body: '#3D4551',
  muted: '#5B616B',
  panel: '#EEE9DF',
  line: '#C9C1B1',
  footer: '#F7F3EA',
};
const FONT = "'Inter', 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "Consolas, Menlo, Monaco, 'Liberation Mono', 'Courier New', monospace";
const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';

// Rutas públicas de la web (apps/web/public) desde las que el correo carga sus imágenes.
const ASSET = {
  logo: '/assets/events/umsspira-logo-desktop.png',
  check: '/email/check-badge.png',
  clock: '/email/clock.png',
  shield: '/email/shield.png',
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ApprovalHtmlInput {
  name: string;
  code: string;
  activationLink: string;
  applicationId: string;
  // Dirección pública de la web (WEB_BASE_URL), sin barra final.
  origin: string;
}

// Cuerpo HTML del correo de aprobación. Usa tablas y estilos en línea porque los clientes
// de correo no soportan CSS moderno. Todo valor variable se escapa antes de entrar al HTML.
export function renderApprovalHtml(input: ApprovalHtmlInput): string {
  const c = COLOR;
  const name = escapeHtml(input.name.trim());
  const cellWidth = Math.floor(100 / Math.max(input.code.length, 1));
  const digits = input.code
    .split('')
    .map(
      (digit) =>
        `<td align="center" width="${cellWidth}%" style="padding:10px 0;font-family:${FONT};font-size:38px;line-height:44px;font-weight:700;color:${c.ink};">${escapeHtml(digit)}</td>`,
    )
    .join('');
  const link = escapeHtml(input.activationLink);
  const id = escapeHtml(input.applicationId);
  const origin = escapeHtml(input.origin);
  const logo = origin + ASSET.logo;
  const checkIcon = origin + ASSET.check;
  const clockIcon = origin + ASSET.clock;
  const shieldIcon = origin + ASSET.shield;
  const hello = name ? 'Hola ' + name + ',' : 'Hola,';
  const kicker =
    'font-size:11px;line-height:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;';
  const text = `font-family:${FONT};font-size:14px;line-height:22px;color:${c.body};`;
  const step = (n: number, label: string) => `<tr>
<td width="34" valign="top" style="padding:0 12px 10px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="22" height="22" bgcolor="${c.accent}" style="width:22px;height:22px;border-radius:11px;font-family:${FONT};font-size:12px;line-height:22px;font-weight:700;color:${c.ink};">${n}</td></tr></table></td>
<td valign="top" style="padding:0 0 10px 0;${text}">${label}</td>
</tr>`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="${FONT_LINK}" rel="stylesheet">
<title>Solicitud aprobada</title>
</head>
<body style="margin:0;padding:0;background:${c.page};font-family:${FONT};color:${c.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:632px;background:${c.frame};border:1px solid ${c.frameLine};border-radius:18px;">
<tr><td style="padding:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.card};border:1px solid ${c.cardLine};border-radius:14px;overflow:hidden;">
<tr><td style="background:${c.header};padding:16px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td align="left"><img src="${logo}" alt="UMSSPIRA" height="30" style="display:block;border:0;height:30px;width:auto;font-family:${FONT};font-size:18px;font-weight:700;color:#FFFFFF;"></td>
<td align="right" style="font-family:${FONT};${kicker}color:#D5D9E0;">Universidad Mayor de San Simón</td>
</tr></table>
</td></tr>
<tr><td align="center" style="padding:36px 28px 0 28px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td align="center" valign="middle" width="56" height="56" bgcolor="${c.accent}" style="width:56px;height:56px;border-radius:28px;"><img src="${checkIcon}" alt="&#10003;" width="28" height="28" style="display:block;margin:0 auto;border:0;width:28px;height:28px;font-family:${FONT};font-size:22px;font-weight:700;color:${c.ink};"></td>
</tr></table>
<h1 style="margin:22px 0 14px 0;font-family:${FONT};font-size:24px;line-height:30px;font-weight:700;color:${c.ink};">¡Tu solicitud fue aprobada!</h1>
<p style="margin:0 0 6px 0;font-family:${FONT};font-size:15px;line-height:24px;font-weight:600;color:${c.ink};">${hello}</p>
<p style="margin:0;font-family:${FONT};font-size:15px;line-height:24px;color:${c.body};">Nos complace informarte que se han revisado y validado satisfactoriamente tus antecedentes académicos y documentación de respaldo para la emisión y acreditación institucional.</p>
</td></tr>
<tr><td style="padding:28px 28px 8px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.panel};border:1px solid ${c.line};border-radius:12px;"><tr>
<td align="center" style="padding:22px 20px 18px 20px;">
<div style="font-family:${FONT};${kicker}color:${c.muted};">Código de activación temporal (OTP)</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 14px 0;table-layout:fixed;background:#FFFFFF;border:1px solid ${c.line};border-radius:8px;"><tr>${digits}</tr></table>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="padding-right:8px;"><img src="${clockIcon}" alt="" width="16" height="16" style="display:block;border:0;width:16px;height:16px;"></td>
<td valign="middle" align="center" style="font-family:${FONT};font-size:12px;line-height:18px;color:${c.muted};">Este código tiene una vigencia de 24 horas a partir de la recepción de este mensaje.</td>
</tr></table>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:20px 28px 8px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td bgcolor="${c.accent}" style="border-radius:8px;box-shadow:0 2px 6px rgba(15,23,42,0.18);"><a href="${link}" style="display:inline-block;padding:15px 48px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:${c.ink};text-decoration:none;">Activar mi cuenta</a></td>
</tr></table>
<p style="margin:16px 0 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${c.muted};">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${link}" style="color:${c.muted};word-break:break-all;">${link}</a></p>
</td></tr>
<tr><td style="padding:24px 28px 6px 28px;border-top:1px solid ${c.cardLine};">
<div style="margin:0 0 14px 0;font-family:${FONT};${kicker}color:${c.ink};">Cómo activar tu cuenta</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${step(1, 'Pulsa «Activar mi cuenta» o abre el enlace de este mensaje.')}
${step(2, 'Escribe el código de activación de 6 dígitos que aparece arriba.')}
${step(3, 'Crea tu contraseña institucional y accede a tu cuenta.')}
</table>
</td></tr>
<tr><td style="padding:10px 28px 6px 28px;">
<div style="margin:0 0 8px 0;font-family:${FONT};${kicker}color:${c.ink};">Si el código no funciona</div>
<p style="margin:0 0 12px 0;${text}">El código se invalida tras 5 intentos incorrectos o al cumplirse sus 24 horas. En ese caso, ingresa a la pantalla de activación y pulsa «Reenviar código»: recibirás uno nuevo y el anterior dejará de funcionar. Entre un reenvío y otro hay una breve espera.</p>
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${c.muted};">Número de solicitud: <span style="font-family:${MONO};color:${c.ink};">${id}</span></p>
</td></tr>
<tr><td style="padding:18px 28px 26px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.footer};border:1px solid ${c.line};border-radius:8px;"><tr>
<td width="16" valign="top" style="padding:13px 0 12px 14px;"><img src="${shieldIcon}" alt="" width="16" height="16" style="display:block;border:0;width:16px;height:16px;"></td>
<td style="padding:12px 14px 12px 10px;font-family:${FONT};font-size:12px;line-height:18px;font-weight:600;color:${c.ink};">Aviso de seguridad institucional: Si no solicitaste este trámite, ignora este mensaje.</td>
</tr></table>
</td></tr>
<tr><td align="center" style="padding:20px 28px;border-top:1px solid ${c.cardLine};background:${c.footer};font-family:${FONT};font-size:12px;line-height:18px;color:${c.muted};"><strong style="color:${c.ink};">Universidad Mayor de San Simón</strong><br>Sistema Oficial UMSSPIRA — Cochabamba, Bolivia<br><span style="font-size:11px;line-height:16px;">Este es un mensaje institucional generado automáticamente. Por favor no responda directamente a este correo.</span></td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}