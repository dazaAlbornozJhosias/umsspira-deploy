'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CreateEventDto, EventItem, UpdateDraftEventDto } from '@umsspira/shared-types';
import EventForm from '@/shared/components/event-form';
import { EventAdminTabs } from '@/shared/components/events-ui';
import { getAdminEvent, removeEventCover, updatePublishedEvent, uploadEventCover } from '@/shared/services/events-service';
import { useAuthenticatedUserId } from '@/modules/auth/frontend/components/authenticated-user-context';

export function EventPublishedEditor({ eventId }: { eventId: string }) {
  const userId = useAuthenticatedUserId();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setError('No hay un usuario autenticado disponible para consultar el evento.');
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    void getAdminEvent(eventId, userId).then((item) => {
      if (active && item.status === 'PUBLICADO') setEvent(item);
      else if (active) setError('Este evento ya no está publicado y no se puede editar desde aquí.');
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el evento.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, userId]);

  const handleSubmit = async (dto: CreateEventDto, image: File | null) => {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    setSaved(false);
    let imageUrl: string | undefined;
    let persisted = false;
    try {
      if (image) imageUrl = await uploadEventCover(image);
      const changes: UpdateDraftEventDto = {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,
        maxCapacity: dto.maxCapacity,
        location: dto.location,
        ...(imageUrl ? { imageUrl } : {}),
      };
      const updated = await updatePublishedEvent(eventId, changes, userId);
      setEvent(updated);
      persisted = true;
      setSaved(true);
    } catch (reason) {
      if (imageUrl && !persisted) await removeEventCover(imageUrl).catch(() => undefined);
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el evento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="events-page event-create-page">
      <header className="event-create-heading">
        <h1>Editar evento publicado</h1>
        <p>Actualiza la información del evento. Su estado seguirá siendo Publicado.</p>
      </header>
      <EventAdminTabs active="management" />
      {error ? <div className="event-feedback" role="alert">{error}</div> : null}
      {saved ? <div className="event-feedback" role="status">Cambios guardados correctamente.</div> : null}
      {loading ? <p className="events-list-footer" role="status">Cargando evento…</p> : null}
      {!loading && event ? (
        <div className="event-create-layout">
          <EventForm
            initialEvent={event}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/events')}
            isSubmitting={submitting}
            allowPublication={false}
            showDraftSaveButton={false}
            submitLabel="Guardar cambios"
            capacityMinimum={event.currentCapacity ?? 0}
          />
        </div>
      ) : null}
    </main>
  );
}
