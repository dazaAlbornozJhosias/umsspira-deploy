import { escapeHtml } from './html-mail';

export const OBSERVED_MAIL_SUBJECT = '[UMSSPIRA] Tu solicitud de registro requiere correcciones';

export type ObservedMailInput = {
  fullName?: string | null;
  category: string;
  note: string;
  correctionUrl: string;
  origin?: string;
};

export type ObservedMail = {
  type: 'observacion';
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

export function buildObservedMail(input: ObservedMailInput): ObservedMail {
  const greeting = input.fullName?.trim() ? `Hola ${input.fullName.trim()},` : 'Hola,';
  const text = [
    greeting,
    '',
    'Durante el proceso de auditoría y cotejo documental, el auditor a cargo ha emitido observaciones que requieren tu subsanación para continuar con el trámite.',
    '',
    `Categoría de observación: ${input.category}`,
    `Justificación del auditor: ${input.note}`,
    '',
    'Tus datos anteriores y el historial de tu trámite se conservarán intactos. Solo deberás sustituir el documento observado o ajustar la información señalada.',
    '',
    `Corrige tu solicitud en este enlace: ${input.correctionUrl}`,
    '',
    'El enlace es personal, de uso único y tiene una vigencia limitada. No lo compartas.',
    '',
    'Universidad Mayor de San Simón',
    'Sistema Oficial UMSSPIRA — Cochabamba, Bolivia',
    'Este es un mensaje institucional generado automáticamente. Por favor no responda directamente a este correo.',
  ].join('\n');

  return {
    type: 'observacion',
    subject: OBSERVED_MAIL_SUBJECT,
    text,
    html: renderObservedHtml(input),
  };
}

export function renderObservedHtml(input: ObservedMailInput): string {
  const origin = stripTrailingSlash(
    input.origin ?? process.env.WEB_BASE_URL ?? process.env.WEB_ORIGIN ?? 'http://localhost:3001',
  );
  const logo = `${origin}/assets/events/umsspira-logo-desktop.png`;
  const editIcon = `${origin}/email/edit-badge.png`;
  const shield = `${origin}/email/shield.png`;
  const name = input.fullName?.trim() ? escapeHtml(input.fullName.trim()) : '';
  const category = escapeHtml(input.category);
  const note = escapeHtml(input.note).replace(/\r?\n/g, '<br>');
  const url = escapeHtml(input.correctionUrl);

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(OBSERVED_MAIL_SUBJECT)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.page};font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.page};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${COLOR.frame};border:1px solid ${COLOR.frameLine};border-radius:16px;"><tr><td style="padding:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.card};border:1px solid ${COLOR.cardLine};border-radius:12px;overflow:hidden;">
<tr><td style="background:${COLOR.header};padding:18px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" style="vertical-align:middle;"><img src="${logo}" alt="UMSSPIRA" height="32" style="display:block;height:32px;width:auto;border:0;color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:700;">
<td align="right" style="vertical-align:middle;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${COLOR.line};">Universidad Mayor de San Simón</td>
</tr></table></td></tr>
<tr><td align="center" style="padding:32px 32px 8px 32px;">
<img src="${editIcon}" alt="" width="44" height="44" style="display:block;width:44px;height:44px;border:0;margin:0 auto 16px auto;">
<h1 style="margin:0 0 12px 0;font-family:${FONT};font-size:24px;line-height:30px;font-weight:700;color:${COLOR.ink};">Tu solicitud necesita correcciones</h1>
<p style="margin:0;font-family:${FONT};font-size:15px;line-height:23px;color:${COLOR.body};">${name ? `Hola ${name}. ` : ''}Durante el proceso de auditoría y cotejo documental, el auditor a cargo ha emitido observaciones que requieren tu subsanación para continuar con el trámite.</p>
</td></tr>
<tr><td style="padding:20px 32px 8px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.panel};border:1px solid ${COLOR.line};border-radius:12px;"><tr><td style="padding:20px;">
<div style="font-family:${FONT};font-size:11px;line-height:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COLOR.ink};padding-bottom:8px;border-bottom:1px solid ${COLOR.line};">Detalle de la observación documental</div>
<div style="font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};padding-top:12px;">Categoría de observación:</div>
<div style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:700;color:${COLOR.ink};padding:2px 0 12px 0;">${category}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.card};border:1px solid ${COLOR.cardLine};border-radius:8px;"><tr><td style="padding:12px 14px;">
<div style="font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">Justificación del auditor:</div>
<div style="font-family:${FONT};font-size:13px;line-height:20px;font-style:italic;color:${COLOR.ink};padding-top:4px;">&ldquo;${note}&rdquo;</div>
</td></tr></table>
</td></tr></table></td></tr>
<tr><td style="padding:12px 32px 8px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.footer};border:1px solid ${COLOR.cardLine};border-radius:10px;"><tr>
<td width="40" valign="top" style="padding:14px 0 14px 14px;"><img src="${shield}" alt="" width="16" height="16" style="display:block;width:16px;height:16px;border:0;"></td>
<td style="padding:14px 14px 14px 6px;font-family:${FONT};font-size:13px;line-height:19px;font-weight:700;color:${COLOR.ink};">Tus datos anteriores y el historial de tu trámite se conservarán intactos. Solo deberás sustituir el documento observado o ajustar la información señalada.</td>
</tr></table></td></tr>
<tr><td align="center" style="padding:24px 32px 8px 32px;">
<a href="${url}" style="display:inline-block;background:${COLOR.accent};color:${COLOR.ink};font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;text-decoration:none;padding:14px 40px;border-radius:8px;box-shadow:0 2px 4px rgba(27,38,50,0.18);">Corregir mi solicitud</a>
</td></tr>
<tr><td align="center" style="padding:12px 32px 28px 32px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${url}" style="color:${COLOR.ink};word-break:break-all;">${url}</a><br>El enlace es personal, de uso único y tiene una vigencia limitada.</td></tr>
<tr><td align="center" style="background:${COLOR.footer};border-top:1px solid ${COLOR.cardLine};padding:20px 24px;font-family:${FONT};">
<div style="font-size:12px;line-height:18px;font-weight:700;color:${COLOR.ink};">Universidad Mayor de San Simón</div>
<div style="font-size:12px;line-height:18px;color:${COLOR.body};">Sistema Oficial UMSSPIRA — Cochabamba, Bolivia</div>
<div style="font-size:11px;line-height:16px;color:${COLOR.muted};padding-top:8px;">Este es un mensaje institucional generado automáticamente. Por favor no responda directamente a este correo.</div>
</td></tr>
</table></td></tr></table></td></tr></table></body></html>`;
}