import { z } from 'zod';
import { mentorInitials } from './mentor-directory';

/** `null` significa que el mentor todavía no configuró su disponibilidad. */
export type MentorDetailAvailability = 'AVAILABLE' | 'PAUSED' | 'UNAVAILABLE' | null;

export interface MentorSlotDay {
  date: string;
  dayLabel: string;
  times: string[];
}

export interface MentorInterestGroup {
  area: string;
  items: string[];
}

/**
 * Public mentor profile detail contract.
 * Strictly excludes private attributes (email, phone, internal identifiers).
 */
export interface MentorDetailProfile {
  id: string;
  fullName: string;
  photoUrl: string | null;
  jobTitle?: string | null;
  company?: string | null;
  about?: string | null;
  experience?: string | null;
  relevantInfo?: string | null;
  technicalAreas: string[];
  interests: MentorInterestGroup[];
  availability: MentorDetailAvailability;
  weekLabel?: string;
  slots: MentorSlotDay[];
}

export const mentorDetailSlotDaySchema = z.object({
  date: z.string(),
  dayLabel: z.string(),
  times: z.array(z.string()),
});

export const mentorDetailInterestGroupSchema = z.object({
  area: z.string(),
  items: z.array(z.string()),
});

export const mentorDetailProfileSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  photoUrl: z.string().nullable().default(null),
  jobTitle: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  relevantInfo: z.string().nullable().optional(),
  technicalAreas: z.array(z.string()).default([]),
  interests: z.array(mentorDetailInterestGroupSchema).default([]),
  availability: z.enum(['AVAILABLE', 'PAUSED', 'UNAVAILABLE']).nullable(),
  weekLabel: z.string().optional(),
  slots: z.array(mentorDetailSlotDaySchema).default([]),
});

export { mentorInitials };

const MENTOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El API identifica a los mentores por UUID; otro formato es un enlace mal formado. */
export function isMentorId(value: string): boolean {
  return MENTOR_ID_PATTERN.test(value.trim());
}

export function formatProfession(jobTitle?: string | null, company?: string | null): string | null {
  const parts = [jobTitle?.trim(), company?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' | ') : null;
}

export function availabilityBadgeConfig(availability: MentorDetailAvailability): {
  label: string;
  className: string;
} {
  switch (availability) {
    case 'AVAILABLE':
      return { label: 'Disponible', className: 'mentor-detail-badge-available' };
    case 'PAUSED':
      return { label: 'Disponibilidad pausada', className: 'mentor-detail-badge-paused' };
    case 'UNAVAILABLE':
      return { label: 'No disponible', className: 'mentor-detail-badge-unavailable' };
    default:
      return { label: 'Disponibilidad sin configurar', className: 'mentor-detail-badge-paused' };
  }
}
