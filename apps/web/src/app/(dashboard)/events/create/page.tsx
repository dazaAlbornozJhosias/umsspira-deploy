'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EVENT_STATUS, type CreateEventDto } from '@umsspira/shared-types';
import EventForm from '@/shared/components/event-form';
import {
  EventAdminTabs,
  EventManagementContent,
  EventSuccessDialog,
} from '@/shared/components/events-ui';
import { createEvent } from '@/shared/services/events-service';

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [validationCount, setValidationCount] = useState(0);
  const [published, setPublished] = useState(false);

  const handleValidationChange = useCallback((count: number) => {
    setValidationCount(count);
  }, []);

  const handleSubmit = async (event: CreateEventDto, _image: File | null) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setDraftSaved(false);

    try {
      await createEvent(event);

      if (event.status === EVENT_STATUS.PUBLICADO) {
        setPublished(true);
      } else {
        setDraftSaved(true);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo guardar el evento. Inténtalo nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (published) {
    return (
      <>
        <EventManagementContent compact />
        <EventSuccessDialog onBack={() => router.push('/events')} />
      </>
    );
  }

  return (
    <main className="events-page event-create-page">
      <header className="event-create-heading">
        <h1>Crear evento</h1>
        <p>
          {validationCount > 0
            ? 'Corrige los campos marcados antes de publicar.'
            : 'Completa la información del evento universitario.'}
        </p>
      </header>

      <EventAdminTabs active="create" />

      {errorMessage && <div className="event-feedback" role="alert">{errorMessage}</div>}
      {draftSaved && <div className="event-feedback" role="status">Borrador guardado correctamente.</div>}

      <div className="event-create-layout">
        <EventForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/events')}
          onValidationChange={handleValidationChange}
          isSubmitting={isSubmitting}
        />
      </div>
    </main>
  );
}
