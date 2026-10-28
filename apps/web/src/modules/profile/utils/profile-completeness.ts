import type { ProfileRecords } from '@/modules/profile/types/profile-record';

// Mismos nombres que las secciones de Completar perfil; también es el valor de ?seccion= (T6.6)
export type CompletenessSectionId =
  | 'formacion-academica'
  | 'experiencia-laboral'
  | 'certificaciones'
  | 'descripcion-profesional';

const SECTION_IDS: readonly CompletenessSectionId[] = [
  'formacion-academica',
  'experiencia-laboral',
  'certificaciones',
  'descripcion-profesional',
];

// ?seccion= llega por URL: solo se acepta una de las 4 secciones
export function seccionDeUrl(valor: string | undefined): CompletenessSectionId | undefined {
  return SECTION_IDS.find((id) => id === valor);
}

// Acceso directo al formulario de la sección faltante; al terminar, «Volver» regresa al resumen (T6.6)
export function completarSeccionHref(id: CompletenessSectionId): string {
  return `/profile/completar?${new URLSearchParams({ seccion: id, returnTo: '/profile' })}`;
}

export type CompletenessSection = {
  id: CompletenessSectionId;
  label: string;
  complete: boolean;
};

export type ProfileCompleteness = {
  // 0 a 100; cada una de las 4 secciones vale lo mismo
  percentage: number;
  sections: CompletenessSection[];
  missing: CompletenessSection[];
};

// Completitud del perfil (HU-06): Formación, Experiencia y Certificaciones cuentan con al menos un
// registro; la descripción, si tiene texto
export function profileCompleteness(records: ProfileRecords, description: string): ProfileCompleteness {
  const sections: CompletenessSection[] = [
    { id: 'formacion-academica', label: 'Formación', complete: records.education.length > 0 },
    { id: 'experiencia-laboral', label: 'Experiencia', complete: records.experience.length > 0 },
    { id: 'certificaciones', label: 'Certificaciones', complete: records.certification.length > 0 },
    { id: 'descripcion-profesional', label: 'Descripción', complete: description.trim().length > 0 },
  ];
  const completas = sections.filter((section) => section.complete).length;
  return {
    percentage: Math.round((completas / sections.length) * 100),
    sections,
    missing: sections.filter((section) => !section.complete),
  };
}
