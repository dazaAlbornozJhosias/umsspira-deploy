import type { ReviewInput } from '../contracts/registration-inputs';
import { renderApprovalHtml } from './html-mail';

export type ResolutionMailType = 'aprobacion' | 'observacion' | 'rechazo';

export interface ResolutionMailInput {
  decision: ReviewInput['decision'];
  applicationId: string;
  fullName: string;
  code?: string | null;
  category?: string;
  note?: string;
  correctionUrl?: string;
  activationUrl?: string;
}

export interface ResolutionMail {
  type: ResolutionMailType;
  subject: string;
  text: string;
  html?: string;
}

function greeting(fullName: string) {
  return fullName.trim() ? 'Hola ' + fullName.trim() + ',' : 'Hola,';
}

function webOrigin(): string {
  const origin = process.env.WEB_BASE_URL || process.env.WEB_ORIGIN || 'http://localhost:3001';
  return origin.replace(/\/+$/, '');
}

// Plantillas del dictamen. Nunca incluyen el código TIT, que es solo para administración.
export function buildResolutionMail(input: ResolutionMailInput): ResolutionMail {
  const hello = greeting(input.fullName);
  if (input.decision === 'APROBADA') {
    if (!input.code) {
      throw new Error('Un dictamen aprobado requiere el código de activación');
    }
    const origin = webOrigin();
    const activationLink = input.activationUrl
      ? input.activationUrl
      : `${origin}/activate?applicationId=${input.applicationId}`;

    return {
      type: 'aprobacion',
      subject: '[UMSSPIRA] ¡Tu solicitud de registro ha sido aprobada!',
      text: [
        hello,
        '',
        'Nos complace informarte que tu solicitud de registro fue revisada y aprobada.',
        '',
        'Para activar tu cuenta:',
        '1. Ingresa al siguiente enlace: ' + activationLink,
        '2. Escribe tu código de activación temporal: ' + input.code,
        '3. Crea tu contraseña institucional y accede a tu cuenta.',
        '',
        'Número de solicitud: ' + input.applicationId,
        '',
        'El código tiene 6 dígitos, vence en 24 horas y se invalida tras 5 intentos incorrectos.',
        'Si vence o se invalida, solicita uno nuevo con «Reenviar código» en la pantalla de activación; el código anterior dejará de funcionar.',
        '',
        'Aviso de seguridad institucional: si no solicitaste este trámite, ignora este mensaje.',
        '',
        'Universidad Mayor de San Simón',
        'Sistema Oficial UMSSPIRA — Cochabamba, Bolivia',
        'Este es un mensaje institucional generado automáticamente. Por favor no responda directamente a este correo.',
      ].join('\n'),
      html: renderApprovalHtml({
        name: input.fullName,
        code: input.code,
        activationLink,
        applicationId: input.applicationId,
        origin,
      }),
    };
  }
  if (input.decision === 'OBSERVADA') {
    return {
      type: 'observacion',
      subject: 'Tu solicitud en UMSSPIRA fue observada',
      text: [
        hello,
        '',
        'Tu solicitud tiene observaciones que debes corregir.',
        '',
        'Categoría: ' + (input.category ?? ''),
        'Explicación: ' + (input.note ?? ''),
        ...(input.correctionUrl
          ? ['', 'Corrige tu solicitud en este enlace: ' + input.correctionUrl]
          : []),
        '',
        'Equipo UMSSPIRA',
      ].join('\n'),
    };
  }
  return {
    type: 'rechazo',
    subject: 'Tu solicitud en UMSSPIRA fue rechazada',
    text: [
      hello,
      '',
      'Tu solicitud fue rechazada.',
      '',
      'Motivo: ' + (input.category ?? ''),
      'Explicación: ' + (input.note ?? ''),
      '',
      'Puedes presentar un nuevo registro con la documentación corregida, mientras no hayas alcanzado el límite de intentos permitido.',
      'Iniciar un nuevo registro: ' + webOrigin() + '/register',
      '',
      'Equipo UMSSPIRA',
    ].join('\n'),
  };
}