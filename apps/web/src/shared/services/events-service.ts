import type {
  CreateEventDto,
  EventParticipantsDto,
  EventRegistrationItem,
  EventItem,
  InactiveEventItem,
  RetiredEventItem,
  UpdateDraftEventDto,
} from '@umsspira/shared-types';

import { apiClient } from './api-client';
import { authenticatedFetch } from './auth-session';
import { readApiError } from './api-contract';

const MAX_EVENT_COVER_SIZE = 5 * 1024 * 1024;
const EVENT_COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadEventCover(file: File): Promise<string> {
  if (!EVENT_COVER_TYPES.has(file.type)) {
    throw new Error('Formato no admitido. Solo se permiten imágenes JPG, PNG o WebP.');
  }
  if (file.size > MAX_EVENT_COVER_SIZE) {
    throw new Error('La imagen no puede superar los 5 MB.');
  }

  const body = new FormData();
  body.append('file', file);
  const response = await authenticatedFetch(
    '/api/v1/events/covers',
    { method: 'POST', body },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.data?.imageUrl) {
    throw new Error(readApiError(result, 'No se pudo guardar la portada.').message);
  }
  return result.data.imageUrl;
}

export async function removeEventCover(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith('/api/v1/events/covers/')) {
    throw new Error('La portada no pertenece a esta API.');
  }
  const response = await authenticatedFetch(
    imageUrl,
    { method: 'DELETE' },
  );
  if (!response.ok) throw new Error('No se pudo limpiar la portada temporal.');
}

export async function getEventCatalog(): Promise<EventItem[]> {
  return (await apiClient<{ data: EventItem[] }>('/api/v1/events/catalog')).data;
}

export async function getPublishedEvent(eventId: string): Promise<EventItem> {
  return (await apiClient<{ data: EventItem }>(
    `/api/v1/events/${encodeURIComponent(eventId)}`,
  )).data;
}

export async function registerForEvent(eventId: string): Promise<EventRegistrationItem> {
  return (await apiClient<{ data: EventRegistrationItem }>(
    `/api/v1/events/${encodeURIComponent(eventId)}/registrations`,
    { method: 'POST', authenticated: true },
  )).data;
}

export async function createEvent(
  event: CreateEventDto,
  userId?: string,
): Promise<EventItem> {
  if (!userId) {
    throw new Error(
      'No hay un usuario autenticado disponible para crear el evento.',
    );
  }

  return (await apiClient<{ data: EventItem }>('/api/v1/events', {
    method: 'POST',
    authenticated: true,
    body: event,
  })).data;
}

export async function getAdminEvents(
  userId?: string,
): Promise<EventItem[]> {
  requireUserId(
    userId,
    'consultar los eventos',
  );

  return (await apiClient<{ data: EventItem[] }>('/api/v1/events/owned', {
    authenticated: true,
  })).data;
}

export async function getAdminDraft(
  eventId: string,
  userId?: string,
): Promise<EventItem> {
  requireUserId(
    userId,
    'consultar el borrador',
  );

  return (await apiClient<{ data: EventItem }>(
    `/api/v1/events/drafts/${encodeURIComponent(eventId)}`,
    { authenticated: true },
  )).data;
}

export async function getAdminEvent(
  eventId: string,
  userId?: string,
): Promise<EventItem> {
  requireUserId(userId, 'consultar el evento');
  return (await apiClient<{ data: EventItem }>(
    `/api/v1/events/owned/${encodeURIComponent(eventId)}`,
    { authenticated: true },
  )).data;
}

export async function updateDraftEvent(
  eventId: string,
  event: UpdateDraftEventDto,
  userId?: string,
): Promise<EventItem> {
  requireUserId(
    userId,
    'actualizar el borrador',
  );

  return (await apiClient<{ data: EventItem }>(
    `/api/v1/events/drafts/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      authenticated: true,
      body: event,
    },
  )).data;
}

export async function publishDraftEvent(
  eventId: string,
  userId?: string,
): Promise<EventItem> {
  requireUserId(
    userId,
    'publicar el borrador',
  );

  return (await apiClient<{ data: EventItem }>(
    `/api/v1/events/drafts/${encodeURIComponent(eventId)}/publish`,
    {
      method: 'PATCH',
      authenticated: true,
    },
  )).data;
}

export async function getEventParticipants(
  eventId: string,
  userId?: string,
): Promise<EventParticipantsDto> {
  requireUserId(userId, 'consultar los participantes');
  return (await apiClient<{ data: EventParticipantsDto }>(
    `/api/v1/events/owned/${encodeURIComponent(eventId)}/participants`,
    { authenticated: true },
  )).data;
}

// --- FUNCIONES RESTAURADAS ---

export async function getInactiveEvents(
  userId?: string,
): Promise<InactiveEventItem[]> {
  requireUserId(userId, 'consultar los eventos inactivos');
  return (await apiClient<{ data: InactiveEventItem[] }>('/api/v1/events/inactive', {
    authenticated: true,
  })).data;
}

export async function retireEvent(
  eventId: string,
  userId?: string,
): Promise<RetiredEventItem> {
  requireUserId(userId, 'retirar el evento');
  return (await apiClient<{ data: RetiredEventItem }>(
    `/api/v1/events/inactive/${encodeURIComponent(eventId)}/retire`,
    {
      method: 'PATCH',
      authenticated: true,
    },
  )).data;
}

// -----------------------------

function requireUserId(
  userId: string | undefined,
  operation: string,
): string {
  if (!userId) {
    throw new Error(
      `No hay un usuario autenticado disponible para ${operation}.`,
    );
  }

  return userId;
}