'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CreateEventDto,
  EventItem,
  UpdateDraftEventDto,
} from '@umsspira/shared-types';

import EventForm from '@/shared/components/event-form';
import { EventAdminTabs } from '@/shared/components/events-ui';
import {
  getAdminDraft,
  updateDraftEvent,
} from '@/shared/services/events-service';

interface EventDraftEditorProps {
  eventId: string;
  userId?: string;
}

export function EventDraftEditor({
  eventId,
  userId,
}: EventDraftEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    userId
      ? null
      : 'No hay un usuario autenticado disponible para consultar el borrador.',
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationCount, setValidationCount] = useState(0);

  useEffect(() => {
    let isActive = true;

    if (!userId) {
      setDraft(null);
      setIsLoading(false);
      setErrorMessage(
        'No hay un usuario autenticado disponible para consultar el borrador.',
      );
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setErrorMessage(null);

    void getAdminDraft(eventId, userId)
      .then((event) => {
        if (isActive) setDraft(event);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setDraft(null);
          setErrorMessage(getRequestErrorMessage(error));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [eventId, userId]);

  const handleSubmit = async (
    event: CreateEventDto,
    _image: File | null,
  ) => {
    if (!userId) {
      setErrorMessage(
        'No hay un usuario autenticado disponible para actualizar el borrador.',
      );
      return;
    }

    const changes: UpdateDraftEventDto = {
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      maxCapacity: event.maxCapacity,
      location: event.location,
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedDraft = await updateDraftEvent(
        eventId,
        changes,
        userId,
      );
      setDraft(updatedDraft);
      setSuccessMessage('Cambios del borrador guardados correctamente.');
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="events-page event-create-page">
      <header className="event-create-heading">
        <h1>Editar borrador</h1>
        <p>
          {validationCount > 0
            ? 'Corrige los campos marcados antes de guardar.'
            : 'Actualiza la información del evento universitario.'}
        </p>
      </header>

      <EventAdminTabs active="drafts" />

      {errorMessage ? <div className="event-feedback" role="alert">{errorMessage}</div> : null}
      {successMessage ? <div className="event-feedback" role="status">{successMessage}</div> : null}
      {isLoading ? <p className="events-list-footer" role="status">Cargando borrador…</p> : null}

      {!isLoading && draft ? (
        <div className="event-create-layout">
          <EventForm
            initialEvent={draft}
            allowPublication={false}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/events/drafts')}
            onValidationChange={setValidationCount}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : null}
    </main>
  );
}

function getRequestErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'No se pudo completar la operación. Inténtalo nuevamente.';
}
