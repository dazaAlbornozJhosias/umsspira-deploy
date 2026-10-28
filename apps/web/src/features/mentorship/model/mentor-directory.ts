import type { MentorDirectoryResponse } from '@umsspira/shared-types';
import type { InterestArea, InterestConfiguration } from './mentor-interests';

/** Vocabulario del contrato público del directorio (HU 6.7). `null` = sin estado registrado. */
export type DirectoryAvailabilityStatus = MentorDirectoryResponse['data'][number]['availabilityStatus'];

/** Public directory data only; contact and private profile fields are excluded. */
export interface DirectoryMentor {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  areas: { id: string; name: string }[];
  availability: DirectoryAvailabilityStatus;
  /** Cargo and company from the directory's public response, when provided. */
  profession?: string;
  interests?: { id: string; name: string; areaId: string }[];
}

export interface DirectoryPage {
  mentors: DirectoryMentor[];
  total: number;
  catalog: InterestArea[];
  interestsSupported: boolean;
}

export interface DirectoryQuery extends InterestConfiguration {
  offset: number;
  limit: number;
}

export const DIRECTORY_PAGE_SIZE = 6;
export const emptyDirectoryFilters = (): InterestConfiguration => ({ areaIds: [], topicIds: [] });

export function mentorInitials(name: string): string {
  const words = name.trim().replace(/^(?:ing|lic|dra|dr|msc)\.?\s+/i, '').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase('es') || 'M';
}

/**
 * Filtra mentores según los criterios aplicados de áreas e intereses (CA-06, CA-07, Tarea 105).
 * - Dentro de áreas se aplica lógica OR (coincide con cualquiera de las áreas seleccionadas).
 * - Dentro de intereses se aplica lógica OR (coincide con cualquiera de los intereses seleccionados).
 * - Entre áreas e intereses se aplica lógica AND (debe coincidir con ambos grupos cuando ambos están activos).
 */
export function filterDirectory(mentors: DirectoryMentor[], filters: InterestConfiguration) {
  return mentors.filter(mentor =>
    (!filters.areaIds.length || mentor.areas.some(area => filters.areaIds.includes(area.id)))
    && (!filters.topicIds.length || (mentor.interests && mentor.interests.some(interest => filters.topicIds.includes(interest.id)))),
  );
}

export function directoryCatalog(mentors: DirectoryMentor[]): InterestArea[] {
  const groups = new Map<string, InterestArea>();
  for (const mentor of mentors) {
    for (const area of mentor.areas) {
      if (!groups.has(area.id)) groups.set(area.id, { ...area, description: '', topics: [] });
    }
    for (const interest of mentor.interests ?? []) {
      const group = groups.get(interest.areaId);
      if (group && !group.topics.some(topic => topic.id === interest.id)) {
        group.topics.push({ id: interest.id, name: interest.name });
      }
    }
  }
  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function uniqueMentors(mentors: DirectoryMentor[]): DirectoryMentor[] {
  return Array.from(new Map(mentors.map(mentor => [mentor.id, mentor])).values());
}

/** Integration route for the public profile implemented by HU 6.9. */
export function mentorProfileHref(id: string) {
  return `/mentorship/mentors/${encodeURIComponent(id)}`;
}
