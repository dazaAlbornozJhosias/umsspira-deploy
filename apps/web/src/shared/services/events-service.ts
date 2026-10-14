import type {
  CreateEventDto,
  EventItem,
  UpdateDraftEventDto,
} from '@umsspira/shared-types';

import { apiClient } from './api-client';

export function getEventCatalog(): Promise<EventItem[]> {
  return apiClient<EventItem[]>('/api/events/catalog');
}

export function createEvent(
  event: CreateEventDto,
  userId?: string,
): Promise<EventItem> {
  if (!userId) {
    throw new Error(
      'No hay un usuario autenticado disponible para crear el evento.',
    );
  }

  return apiClient<EventItem>('/api/events', {
    method: 'POST',
    headers: {
      'x-user-id': userId,
    },
    body: event,
  });
}

export function getAdminEvents(
  userId?: string,
): Promise<EventItem[]> {
  const authenticatedUserId = requireUserId(
    userId,
    'consultar los eventos',
  );

  return apiClient<EventItem[]>('/api/events/admin', {
    headers: {
      'x-user-id': authenticatedUserId,
    },
  });
}

export function getAdminDraft(
  eventId: string,
  userId?: string,
): Promise<EventItem> {
  const authenticatedUserId = requireUserId(
    userId,
    'consultar el borrador',
  );

  return apiClient<EventItem>(
    `/api/events/admin/${encodeURIComponent(eventId)}`,
    {
      headers: {
        'x-user-id': authenticatedUserId,
      },
    },
  );
}

export function updateDraftEvent(
  eventId: string,
  event: UpdateDraftEventDto,
  userId?: string,
): Promise<EventItem> {
  const authenticatedUserId = requireUserId(
    userId,
    'actualizar el borrador',
  );

  return apiClient<EventItem>(
    `/api/events/admin/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        'x-user-id': authenticatedUserId,
      },
      body: event,
    },
  );
}

export function publishDraftEvent(
  eventId: string,
  userId?: string,
): Promise<EventItem> {
  const authenticatedUserId = requireUserId(
    userId,
    'publicar el borrador',
  );

  return apiClient<EventItem>(
    `/api/events/admin/${encodeURIComponent(eventId)}/publish`,
    {
      method: 'PATCH',
      headers: {
        'x-user-id': authenticatedUserId,
      },
    },
  );
}

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
