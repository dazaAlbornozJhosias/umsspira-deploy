import type { ReviewInput } from '../contracts/registration-inputs';

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
}

function greeting(fullName: string) {
  return fullName.trim() ? 'Hola ' + fullName.trim() + ',' : 'Hola,';
}

// Plantillas del dictamen. Nunca incluyen el código TIT, que es solo para administración.
export function buildResolutionMail(input: ResolutionMailInput): ResolutionMail {
  const hello = greeting(input.fullName);
    if (input.decision === 'APROBADA') {
    if (!input.code) {
      throw new Error('Un dictamen aprobado requiere el código de activación');
    }
    const webOrigin = process.env.WEB_BASE_URL || process.env.WEB_ORIGIN || 'http://localhost:3001';
    const activationLink = input.activationUrl
      ? input.activationUrl
      : `${webOrigin}/activate?applicationId=${input.applicationId}`;

    return {
      type: 'aprobacion',
      subject: 'Tu solicitud en UMSSPIRA fue aprobada',
      text: [
        hello,
        '',
        'Tu solicitud fue aprobada. Para activar tu cuenta ingresa directamente al siguiente enlace:',
        '',
        activationLink,
        '',
        'Código de activación: ' + input.code,
        'Número de solicitud: ' + input.applicationId,
        '',
        'El código tiene 6 dígitos, vence en 24 horas y se invalida tras 5 intentos incorrectos.',
        'Si vence, solicita uno nuevo con Reenviar código en la pantalla de activación.',
        '',
        'Equipo UMSSPIRA',
      ].join('\n'),
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
      '',
      'Equipo UMSSPIRA',
    ].join('\n'),
  };
}