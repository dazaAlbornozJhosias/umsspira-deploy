import { escapeHtml } from './html-mail';

export const REJECTED_MAIL_SUBJECT = '[UMSSPIRA] Notificación sobre el resultado de tu solicitud';

export type RejectedMailInput = {
  fullName?: string | null;
  category?: string | null;
  note?: string | null;
  /** Intentos de registro que le quedan tras este rechazo. null = no se pudo calcular. */
  remainingAttempts: number | null;
  origin?: string;
};

export type RejectedMail = {
  type: 'rechazo';
  subject: string;
  text: string;
  html: string;
};

const COLOR = {
  page: '#FAF6EE',
  frame: '#EEE9DF',
  frameLine: '#D9D2C5',
  card: '#FFFFFF',
  cardLine: '#E0D9CB',
  header: '#0F172A',
  accent: '#FFB162',
  danger: '#B4452F',
  ink: '#1B2632',
  body: '#3D4551',
  muted: '#5B616B',
  panel: '#EEE9DF',
  line: '#C9C1B1',
  footer: '#F7F3EA',
};
const FONT = "Inter,'Segoe UI',Helvetica,Arial,sans-serif";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveOrigin(input: RejectedMailInput): string {
  return stripTrailingSlash(
    input.origin ?? process.env.WEB_BASE_URL ?? process.env.WEB_ORIGIN ?? 'http://localhost:3001',
  );
}

function limitReached(input: RejectedMailInput): boolean {
  return input.remainingAttempts !== null && input.remainingAttempts <= 0;
}

function attemptsMessage(input: RejectedMailInput): string {
  if (limitReached(input)) {
    return 'Has alcanzado el límite de cinco solicitudes rechazadas, por lo que ya no es posible registrar una nueva solicitud.';
  }
  const count = input.remainingAttempts;
  const quantity =
    count === null
      ? 'Aún cuentas con intentos de registro disponibles en la plataforma.'
      : `Aún cuentas con ${count} ${count === 1 ? 'intento' : 'intentos'} de registro disponibles en la plataforma.`;
  return `${quantity} Puedes subsanar tu situación iniciando una nueva postulación con la documentación reglamentaria actualizada.`;
}

export function buildRejectedMail(input: RejectedMailInput): RejectedMail {
  const greeting = input.fullName?.trim() ? `Hola ${input.fullName.trim()},` : 'Hola,';
  const registerUrl = `${resolveOrigin(input)}/register`;
  const lines = [
    greeting,
    '',
    'Te comunicamos que, tras la revisión pericial de antecedentes ante el sistema universitario, la solicitud de validación no pudo ser aprobada.',
    '',
    ...(input.category?.trim() ? [`Categoría: ${input.category.trim()}`] : []),
    `Motivo específico del rechazo: ${input.note?.trim() || 'No se registró un motivo.'}`,
    '',
    'El expediente actual ha sido formalmente cerrado en el sistema de gestión.',
    '',
    attemptsMessage(input),
    ...(limitReached(input) ? [] : ['', `Iniciar nuevo registro: ${registerUrl}`]),
    '',
    'Universidad Mayor de San Simón',
    'Sistema Oficial UMSSPIRA — Cochabamba, Bolivia',
    'Este es un mensaje institucional generado automáticamente. Por favor no responda directamente a este correo.',
  ];

  return {
    type: 'rechazo',
    subject: REJECTED_MAIL_SUBJECT,
    text: lines.join('\n'),
    html: renderRejectedHtml(input),
  };
}

export function renderRejectedHtml(input: RejectedMailInput): string {
  const origin = resolveOrigin(input);
  const logo = `${origin}/assets/events/umsspira-logo-desktop.png`;
  const icon = `${origin}/email/gavel-badge.png`;
  const registerUrl = escapeHtml(`${origin}/register`);
  const category = input.category?.trim() ? escapeHtml(input.category.trim()) : '';
  const note = escapeHtml(input.note?.trim() || 'No se registró un motivo.').replace(
    /\r?\n/g,
    '<br>',
  );
  const attempts = escapeHtml(attemptsMessage(input));
  const reached = limitReached(input);

  const button = reached
    ? ''
    : `<tr><td align="center" style="padding:24px 32px 8px 32px;">
<a href="${registerUrl}" style="display:inline-block;background:${COLOR.accent};color:${COLOR.ink};font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;text-decoration:none;padding:14px 40px;border-radius:8px;box-shadow:0 2px 4px rgba(27,38,50,0.18);">Iniciar nuevo registro</a>
</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(REJECTED_MAIL_SUBJECT)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.page};font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.page};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${COLOR.frame};border:1px solid ${COLOR.frameLine};border-radius:16px;"><tr><td style="padding:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.card};border:1px solid ${COLOR.cardLine};border-radius:12px;overflow:hidden;">
<tr><td style="background:${COLOR.header};padding:18px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" style="vertical-align:middle;"><img src="${logo}" alt="UMSSPIRA" height="32" style="display:block;height:32px;width:auto;border:0;color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:700;"></td>
<td align="right" style="vertical-align:middle;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${COLOR.line};">Universidad Mayor de San Simón</td>
</tr></table></td></tr>
<tr><td align="center" style="padding:32px 32px 8px 32px;">
<img src="${icon}" alt="" width="44" height="44" style="display:block;width:44px;height:44px;border:0;margin:0 auto 16px auto;">
<h1 style="margin:0 0 12px 0;font-family:${FONT};font-size:24px;line-height:30px;font-weight:700;color:${COLOR.ink};">Resultado de tu solicitud</h1>
<p style="margin:0;font-family:${FONT};font-size:15px;line-height:23px;color:${COLOR.body};">Te comunicamos que, tras la revisión pericial de antecedentes ante el sistema universitario, la solicitud de validación no pudo ser aprobada.</p>
</td></tr>
<tr><td style="padding:20px 32px 8px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.panel};border:1px solid ${COLOR.line};border-radius:12px;"><tr><td style="padding:20px;">
<div style="font-family:${FONT};font-size:11px;line-height:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COLOR.danger};padding-bottom:8px;border-bottom:1px solid ${COLOR.line};">Dictamen institucional</div>
${category ? `<div style="font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};padding-top:12px;">Categoría:</div>
<div style="font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:${COLOR.ink};padding:2px 0 0 0;">${category}</div>` : ''}
<div style="font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};padding-top:12px;">Motivo específico del rechazo:</div>
<div style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:700;color:${COLOR.ink};padding:2px 0 12px 0;">${note}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.card};border:1px solid ${COLOR.cardLine};border-radius:8px;"><tr><td style="padding:12px 14px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.body};"><strong>Aviso de cierre:</strong> El expediente actual ha sido formalmente cerrado en el sistema de gestión.</td></tr></table>
</td></tr></table></td></tr>
<tr><td style="padding:12px 32px 8px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.footer};border:1px solid ${COLOR.cardLine};border-radius:10px;"><tr>
<td style="padding:14px;font-family:${FONT};font-size:13px;line-height:19px;font-weight:700;color:${COLOR.ink};">${attempts}</td>
</tr></table></td></tr>
${button}
<tr><td align="center" style="padding:12px 32px 28px 32px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">${reached ? '' : `Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${registerUrl}" style="color:${COLOR.ink};word-break:break-all;">${registerUrl}</a>`}</td></tr>
<tr><td align="center" style="background:${COLOR.footer};border-top:1px solid ${COLOR.cardLine};padding:20px 24px;font-family:${FONT};">
<div style="font-size:12px;line-height:18px;font-weight:700;color:${COLOR.ink};">Universidad Mayor de San Simón</div>
<div style="font-size:12px;line-height:18px;color:${COLOR.body};">Sistema Oficial UMSSPIRA — Cochabamba, Bolivia</div>
<div style="font-size:11px;line-height:16px;color:${COLOR.muted};padding-top:8px;">Este es un mensaje institucional generado automáticamente. Por favor no responda directamente a este correo.</div>
</td></tr>
</table></td></tr></table></td></tr></table></body></html>`;
}