import { z } from 'zod';

export const EXPEDITION_DEPARTMENTS = ['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PD', 'EX'] as const;

export const EXPEDITION_LABELS: Record<(typeof EXPEDITION_DEPARTMENTS)[number], string> = {
  LP: 'LP',
  CB: 'CB',
  SC: 'SC',
  OR: 'OR',
  PT: 'PT',
  TJ: 'TJ',
  CH: 'CH',
  BE: 'BE',
  PD: 'PD',
  EX: 'Extranjero',
};

export const MIN_GRADUATION_YEAR = 1970;

const REQUIRED_MESSAGE = 'Este campo es obligatorio.';
const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/;
const NAME_RULE = 'Usa de 2 a 45 caracteres: letras, espacios, tildes, apóstrofe o guion.';

const nameField = z
  .string()
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .min(2, NAME_RULE)
  .max(45, NAME_RULE)
  .regex(nameRegex, NAME_RULE);

export const personalDataSchema = z.object({
  nombres: nameField,
  apellidos: nameField,
  ci: z
    .string()
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .regex(/^\d{5,10}$/, 'El C.I. debe tener entre 5 y 10 dígitos, sin puntos ni guiones.'),
  complementoCi: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Za-z0-9]{0,2}$/, 'Máximo 2 caracteres alfanuméricos (ej. 1A).'),
  expedidoEn: z.enum(EXPEDITION_DEPARTMENTS, { message: REQUIRED_MESSAGE }),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, REQUIRED_MESSAGE)
    .max(100, 'Máximo 100 caracteres.')
    .email('Ingresa un correo electrónico válido.'),
  telefono: z
    .string()
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos.'),
  // Un select deshabilitado (catalogo sin cargar) envia undefined: se muestra el mismo mensaje.
  carreraId: z.string({ message: REQUIRED_MESSAGE }).min(1, REQUIRED_MESSAGE),
  anioEgreso: z.coerce
    .number({ message: REQUIRED_MESSAGE })
    .int(REQUIRED_MESSAGE)
    .min(MIN_GRADUATION_YEAR, REQUIRED_MESSAGE)
    .max(new Date().getFullYear(), `El año no puede ser mayor a ${new Date().getFullYear()}.`),
  codigoSis: z
    .string()
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .regex(/^\d{6,9}$/, 'El Código SIS debe tener de 6 a 9 dígitos.'),
});

export type PersonalDataInput = z.input<typeof personalDataSchema>;
export type PersonalDataValues = z.output<typeof personalDataSchema>;
