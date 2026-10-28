import type {
  AvailabilityStatus,
  DirectoryCatalogGroup,
  DirectoryMentor,
  InterestCatalogGroup,
  Mentor,
  MentorAreas,
  MentorAvailability,
  MentorProfile,
  MentorInterest,
} from '../../domain/entities/mentor';
import type { MentorFilterOptions } from '../../application/contracts/mentor-directory-filters';

const day = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null;

/** El dominio y la BD usan estos estados; el contrato público (shared-types) expone los equivalentes en inglés. */
const PUBLIC_AVAILABILITY: Record<AvailabilityStatus, 'AVAILABLE' | 'PAUSED' | 'UNAVAILABLE'> = {
  DISPONIBLE: 'AVAILABLE',
  EN_PAUSA: 'PAUSED',
  NO_DISPONIBLE: 'UNAVAILABLE',
};

const publicAvailability = (status: AvailabilityStatus | null) =>
  status ? PUBLIC_AVAILABILITY[status] : null;

export function presentMentor(mentor: Mentor) {
  return {
    id: mentor.id,
    experiencia: mentor.experience,
    esta_activo: mentor.active,
    anios_exp: mentor.experienceYears,
    fecha_creacion: day(mentor.createdAt),
    fecha_actualizacion: day(mentor.updatedAt),
  };
}

export function presentMentorInformation(mentor: Mentor | null) {
  return !mentor || (!mentor.description && !mentor.experience)
    ? { exists: false, profile: null }
    : {
        exists: true,
        profile: {
          descripcion: mentor.description,
          experiencia: mentor.experience,
          informacion_relevante: mentor.relevantInformation,
          foto_perfil: mentor.photoUrl,
          anios_exp: mentor.experienceYears,
          fecha_actualizacion: day(mentor.updatedAt),
        },
      };
}

export function presentDirectory(entry: DirectoryMentor) {
  return {
    ...presentMentor(entry.mentor),
    nombre: entry.mentor.graduateName,
    descripcion: entry.mentor.description,
    foto_perfil: entry.mentor.photoUrl,
    areas: entry.areas.map((area) => ({ id: area.id, nombre: area.name })),
    cargo: entry.cargo,
    empresa: entry.empresa,
    intereses: entry.interests.map((interest) => ({
      id: interest.id,
      nombre: interest.name,
      area: { id: interest.area.id, nombre: interest.area.name },
    })),
    availabilityStatus: publicAvailability(entry.availability),
  };
}

export function presentMentorFilterOptions(options: MentorFilterOptions) {
  return {
    areas: options.areas.map((area) => ({ id: area.id, nombre: area.name })),
    intereses: options.interests.map((interest) => ({
      id: interest.id,
      nombre: interest.name,
      id_area: interest.area.id,
      area: { id: interest.area.id, nombre: interest.area.name },
    })),
  };
}

export function presentDirectoryCatalog(catalog: DirectoryCatalogGroup[]) {
  return catalog.map((group) => ({
    area: { id: group.area.id, nombre: group.area.name },
    intereses: group.interests.map((interest) => ({ id: interest.id, nombre: interest.name })),
  }));
}

export function presentInterest(interest: MentorInterest) {
  return {
    id: interest.id,
    nombre: interest.name,
    area: { id: interest.area.id, nombre: interest.area.name },
  };
}

export function presentMentorAreas(state: MentorAreas) {
  return {
    areas: state.catalog.map((area) => ({ id: area.id, nombre: area.name, descripcion: null })),
    selectedIds: state.selectedIds,
    intereses: state.interests.map((interest) => ({
      id_area: interest.area.id,
      nombre: interest.name,
    })),
  };
}

export function presentInterestCatalog(groups: InterestCatalogGroup[]) {
  return groups.map((group) => ({
    area: { id: group.area.id, nombre: group.area.name },
    intereses: group.interests.map((interest) => ({
      ...presentInterest(interest),
      seleccionado: interest.selected,
    })),
  }));
}

export function presentAvailability(state: MentorAvailability) {
  return { availabilityStatus: state.status, fecha_actualizacion: day(state.updatedAt) };
}

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dayMonth = (date: string) => {
  const [, month, dayOfMonth] = date.split('-').map(Number);
  return { day: dayOfMonth, month: MONTHS[month - 1] };
};

function weekLabel(from: string, to: string) {
  const start = dayMonth(from);
  const end = dayMonth(to);
  const first = start.month === end.month ? String(start.day) : `${start.day} ${start.month}`;
  return `Del ${first} al ${end.day} ${end.month} · sesiones de 1 hora`;
}

/** Contrato que consume el perfil detallado del front (HU 6.9). */
export function presentMentorDetail(profile: MentorProfile) {
  const interests = new Map<string, { area: string; items: string[] }>();
  for (const interest of profile.interests) {
    const group = interests.get(interest.area.id) ?? { area: interest.area.name, items: [] };
    group.items.push(interest.name);
    interests.set(interest.area.id, group);
  }
  return {
    id: profile.mentor.id,
    fullName: profile.mentor.graduateName,
    photoUrl: profile.mentor.photoUrl,
    jobTitle: profile.position,
    company: profile.company,
    about: profile.mentor.description,
    experience: profile.mentor.experience,
    relevantInfo: profile.mentor.relevantInformation,
    technicalAreas: profile.areas.map((area) => area.name),
    interests: [...interests.values()],
    availability: publicAvailability(profile.availability),
    weekLabel: weekLabel(profile.week.from, profile.week.to),
    slots: profile.week.slots.map((slot) => {
      const { day: dayOfMonth, month } = dayMonth(slot.date);
      return {
        date: slot.date,
        dayLabel: `${WEEKDAYS[slot.weekday - 1]} ${dayOfMonth} ${month}`,
        times: slot.times,
      };
    }),
  };
}
