import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_ACCOUNTS } from './demo-accounts';

// Las suscripciones push y sus claves las genera el navegador al dar consentimiento.
// La PWA usa las cuentas, permisos y catálogos comunes; no necesita dispositivos ficticios.
export const dispositivos: Array<Prisma.DispositivoCreateManyInput & { id: string }> = [];

const accountId = (role: string): string => {
  const account = DEMO_ACCOUNTS.find((a) => a.role === role);
  if (!account) {throw new Error(`Falta la cuenta demo con rol ${role}`);}
  return account.id;
};

const TITULADO_ID = accountId('titulado');
const ADMIN_ID = accountId('administrador');
const EMPRESA_ID = accountId('empresa');

const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60_000);

// Chat (HU-06): dos conversaciones directas del titulado de demostración.
const CONVERSACION_EMPRESA_ID = '28000000-0000-4000-8000-000000000001';
const CONVERSACION_ADMIN_ID = '28000000-0000-4000-8000-000000000002';

export const conversaciones: Array<Prisma.ConversacionCreateManyInput & { id: string }> = [
  {
    id: CONVERSACION_EMPRESA_ID,
    tipo: 'directo',
    estado_conversacion: 'ACEPTADO',
    creado_por: TITULADO_ID,
    fecha_creacion: minutesAgo(300),
    fecha_actualizacion: minutesAgo(120),
  },
  {
    id: CONVERSACION_ADMIN_ID,
    tipo: 'directo',
    estado_conversacion: 'ACEPTADO',
    creado_por: TITULADO_ID,
    fecha_creacion: minutesAgo(200),
    fecha_actualizacion: minutesAgo(20),
  },
];

export const participantesConversacion: Array<
  Prisma.ParticipanteConversacionCreateManyInput & { id: string }
> = [
  {
    id: '28100000-0000-4000-8000-000000000001',
    conversacion_id: CONVERSACION_EMPRESA_ID,
    usuario_id: TITULADO_ID,
    rol_en_chat: 'participante',
    fecha_union: new Date(),
  },
  {
    id: '28100000-0000-4000-8000-000000000002',
    conversacion_id: CONVERSACION_EMPRESA_ID,
    usuario_id: EMPRESA_ID,
    rol_en_chat: 'participante',
    fecha_union: new Date(),
  },
  {
    id: '28100000-0000-4000-8000-000000000003',
    conversacion_id: CONVERSACION_ADMIN_ID,
    usuario_id: TITULADO_ID,
    rol_en_chat: 'participante',
    fecha_union: new Date(),
  },
  {
    id: '28100000-0000-4000-8000-000000000004',
    conversacion_id: CONVERSACION_ADMIN_ID,
    usuario_id: ADMIN_ID,
    rol_en_chat: 'participante',
    fecha_union: new Date(),
  },
];

export const mensajes: Array<Prisma.MensajeCreateManyInput & { id: string }> = [
  {
    id: '28200000-0000-4000-8000-000000000001',
    id_conversacion: CONVERSACION_EMPRESA_ID,
    emisor_id: EMPRESA_ID,
    contenido: 'Hola, vimos tu perfil y nos interesa conversar sobre una vacante.',
    tipo_contenido: 'texto',
    estado_envio: 'leido',
    fecha_mensaje: minutesAgo(300),
  },
  {
    id: '28200000-0000-4000-8000-000000000002',
    id_conversacion: CONVERSACION_EMPRESA_ID,
    emisor_id: TITULADO_ID,
    contenido: 'Hola, gracias por escribir. ¿Podrías darme más detalles?',
    tipo_contenido: 'texto',
    estado_envio: 'leido',
    fecha_mensaje: minutesAgo(240),
  },
  {
    id: '28200000-0000-4000-8000-000000000003',
    id_conversacion: CONVERSACION_EMPRESA_ID,
    emisor_id: EMPRESA_ID,
    contenido: 'Claro, te envío el enlace de la oferta esta tarde.',
    tipo_contenido: 'texto',
    estado_envio: 'enviado',
    fecha_mensaje: minutesAgo(120),
  },
  {
    id: '28200000-0000-4000-8000-000000000004',
    id_conversacion: CONVERSACION_ADMIN_ID,
    emisor_id: ADMIN_ID,
    contenido: 'Buen día, ¿pudiste revisar el dictamen de tu solicitud?',
    tipo_contenido: 'texto',
    estado_envio: 'leido',
    fecha_mensaje: minutesAgo(200),
  },
  {
    id: '28200000-0000-4000-8000-000000000005',
    id_conversacion: CONVERSACION_ADMIN_ID,
    emisor_id: TITULADO_ID,
    contenido: 'Sí, ya lo vi. Muchas gracias.',
    tipo_contenido: 'texto',
    estado_envio: 'leido',
    fecha_mensaje: minutesAgo(60),
  },
  {
    id: '28200000-0000-4000-8000-000000000006',
    id_conversacion: CONVERSACION_ADMIN_ID,
    emisor_id: ADMIN_ID,
    contenido: 'Perfecto, cualquier duda me escribes.',
    tipo_contenido: 'texto',
    estado_envio: 'enviado',
    fecha_mensaje: minutesAgo(20),
  },
];

export async function seedEpic8(prisma: PrismaClient): Promise<void> {
  if (dispositivos.length > 0) {
    await prisma.dispositivo.createMany({ data: dispositivos, skipDuplicates: true });
  }

  // Orden: conversaciones, luego participantes y mensajes que las referencian
  await prisma.conversacion.createMany({ data: conversaciones, skipDuplicates: true });
  await prisma.participanteConversacion.createMany({
    data: participantesConversacion,
    skipDuplicates: true,
  });
  await prisma.mensaje.createMany({ data: mensajes, skipDuplicates: true });
}
