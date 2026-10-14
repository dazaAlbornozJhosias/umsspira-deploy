'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  EVENT_STATUS,
  type CreateEventDto,
  type EventItem,
} from '@umsspira/shared-types';
import {
  EventConfirmDialog,
  type EventSummary,
} from '@/shared/components/events-ui';

interface EventFormState {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  maxCapacity: string;
  location: string;
  image: File | null;
}

interface EventFormErrors {
  title?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  maxCapacity?: string;
}

interface PendingPublication {
  dto: CreateEventDto;
  summary: EventSummary;
}

export interface EventFormProps {
  onSubmit: (event: CreateEventDto, image: File | null) => void | Promise<void>;
  onCancel?: () => void;
  onValidationChange?: (errorCount: number) => void;
  isSubmitting?: boolean;
  initialEvent?: EventItem;
  allowPublication?: boolean;
}

const initialState: EventFormState = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  maxCapacity: '',
  location: '',
  image: null,
};

export default function EventForm({
  onSubmit,
  onCancel,
  onValidationChange,
  isSubmitting = false,
  initialEvent,
  allowPublication = true,
}: EventFormProps) {
  const [form, setForm] = useState<EventFormState>(() =>
    createInitialState(initialEvent),
  );
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [pendingPublication, setPendingPublication] = useState<PendingPublication | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const errorCount = countValidationGroups(errors);
  const isBusy = isSubmitting || isSavingDraft;

  useEffect(() => {
    onValidationChange?.(errorCount);
  }, [errorCount, onValidationChange]);

  useEffect(() => {
    setForm(createInitialState(initialEvent));
    setErrors({});
  }, [initialEvent]);

  const dateLabel = useMemo(
    () => formatDateLabel(form.startDate, form.startTime, form.endDate, form.endTime),
    [form.endDate, form.endTime, form.startDate, form.startTime],
  );

  const updateField = (field: keyof Omit<EventFormState, 'image'>, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): EventFormErrors => {
    const nextErrors: EventFormErrors = {};

    if (!form.title.trim()) nextErrors.title = 'Este campo es obligatorio.';
    if (!form.startDate) nextErrors.startDate = 'Este campo es obligatorio.';
    if (!form.startTime) nextErrors.startTime = 'Este campo es obligatorio.';
    if (!form.endDate) nextErrors.endDate = 'Este campo es obligatorio.';
    if (!form.endTime) nextErrors.endTime = 'Este campo es obligatorio.';

    const capacity = Number(form.maxCapacity);
    if (
      !form.maxCapacity
      || !Number.isFinite(capacity)
      || !Number.isInteger(capacity)
      || capacity <= 0
    ) {
      nextErrors.maxCapacity = 'Ingresa un cupo entero mayor a 0.';
    }

    if (form.startDate && form.startTime && form.endDate && form.endTime) {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}:00`);
      const endDateTime = new Date(`${form.endDate}T${form.endTime}:00`);

      if (endDateTime <= startDateTime) {
        nextErrors.endDate = 'Debe ser posterior al inicio.';
        nextErrors.endTime = 'Debe ser posterior al inicio.';
      }
    }

    return nextErrors;
  };

  const buildEventDto = (status: 'BORRADOR' | 'PUBLICADO'): CreateEventDto => ({
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    startDate: `${form.startDate}T${form.startTime}:00`,
    endDate: `${form.endDate}T${form.endTime}:00`,
    maxCapacity: Number(form.maxCapacity),
    location: form.location.trim() || undefined,
    status,
  });

  const validateForm = () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const saveDraft = async () => {
    if (!validateForm()) return;

    setIsSavingDraft(true);
    try {
      await onSubmit(buildEventDto(EVENT_STATUS.BORRADOR), form.image);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const requestPublication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setPendingPublication({
      dto: buildEventDto(EVENT_STATUS.PUBLICADO),
      summary: {
        title: form.title.trim(),
        dateLabel,
        location: form.location.trim(),
        maxCapacity: Number(form.maxCapacity),
      },
    });
  };

  const confirmPublication = async () => {
    if (!pendingPublication) return;

    try {
      await onSubmit(pendingPublication.dto, form.image);
    } finally {
      setPendingPublication(null);
    }
  };

  return (
    <>
      <form
        id="event-create-form"
        className={`event-form-card ${errorCount > 0 ? 'has-validation-errors' : ''}`}
        onSubmit={requestPublication}
        aria-busy={isBusy}
        noValidate
      >
        <h2 className="event-form-heading">
          <span className="event-form-step">1</span>
          Información del evento
        </h2>

        {errorCount > 0 && (
          <div className="event-validation-summary" role="alert">
            <span>{errorCount} {errorCount === 1 ? 'campo por revisar' : 'campos por revisar'}</span>
            <small>Revisa la información señalada para continuar.</small>
          </div>
        )}

        <div className="event-form-grid">
          <section className="event-mobile-section">
            <h3 className="event-mobile-section-title">1 Información del evento</h3>
            <FormField label="Título del evento" required error={errors.title} full>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ej. Feria de Oportunidades UMSS"
              />
            </FormField>

            <FormField label="Descripción" optional full>
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Describe brevemente el evento"
              />
            </FormField>
          </section>

          <section className="event-mobile-section">
            <h3 className="event-mobile-section-title">2 Fecha y lugar</h3>
            <FormField label="Fecha de inicio" required error={errors.startDate}>
              <input type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} />
            </FormField>
            <FormField label="Hora de inicio" required error={errors.startTime}>
              <input type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} />
            </FormField>
            <FormField label="Fecha de finalización" required error={errors.endDate}>
              <input type="date" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} />
            </FormField>
            <FormField label="Hora de finalización" required error={errors.endTime}>
              <input type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} />
            </FormField>
            <FormField label="Ubicación" optional location>
              <input
                type="text"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="Ej. Auditorio Central UMSS"
              />
            </FormField>
          </section>

          <section className="event-mobile-section">
            <h3 className="event-mobile-section-title">3 Capacidad y portada</h3>
            <FormField label="Cupo máximo" required error={errors.maxCapacity}>
              <input
                type="number"
                min={1}
                step={1}
                value={form.maxCapacity}
                onChange={(event) => updateField('maxCapacity', event.target.value)}
                placeholder="Ej. 150"
              />
            </FormField>

            <div className="event-field event-image-field">
              <label htmlFor="event-image">Imagen de portada (opcional)</label>
              <label className="event-image-control" htmlFor="event-image">
                <strong>{form.image ? form.image.name : 'Seleccionar imagen'}</strong>
                <span>{form.image ? `Imagen seleccionada · ${formatFileDetails(form.image)}` : 'PNG o JPG · máximo 5 MB'}</span>
              </label>
              <input
                id="event-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  const image = event.target.files?.[0] ?? null;
                  setForm((current) => ({ ...current, image }));
                }}
              />
            </div>
          </section>
        </div>

        <div className="event-form-actions event-form-actions-desktop">
          <button type="button" className="event-button event-button-secondary" onClick={onCancel} disabled={isBusy}>Cancelar</button>
          <button type="button" className="event-button event-button-secondary" onClick={() => void saveDraft()} disabled={isBusy}>
            {isSavingDraft ? 'Guardando…' : 'Guardar borrador'}
          </button>
          {allowPublication ? (
            <button type="submit" className="event-button event-button-primary" disabled={isBusy}>Publicar evento</button>
          ) : null}
        </div>
      </form>

      <EventPreview form={form} dateLabel={dateLabel} hasErrors={errorCount > 0} />

      <div className="event-form-actions event-form-actions-mobile">
        <button type="button" className="event-button event-button-secondary" onClick={onCancel} disabled={isBusy}>Cancelar</button>
        <button type="button" className="event-button event-button-secondary" onClick={() => void saveDraft()} disabled={isBusy}>
          {isSavingDraft ? 'Guardando…' : 'Guardar borrador'}
        </button>
        {allowPublication ? (
          <button type="submit" form="event-create-form" className="event-button event-button-primary" disabled={isBusy}>Publicar</button>
        ) : null}
      </div>

      {pendingPublication && (
        <EventConfirmDialog
          event={pendingPublication.summary}
          isSubmitting={isSubmitting}
          onCancel={() => setPendingPublication(null)}
          onConfirm={() => void confirmPublication()}
        />
      )}
    </>
  );
}

function EventPreview({ form, dateLabel, hasErrors }: { form: EventFormState; dateLabel: string; hasErrors: boolean }) {
  return (
    <aside className="event-preview-card" aria-label="Vista previa del evento">
      <h2>Vista previa</h2>
      <p>Así se verá al publicarlo</p>
      <div className="event-preview-cover"><span>{form.title || 'Evento universitario'}</span></div>
      <h3>{form.title || 'Título del evento'}</h3>
      <p className="event-preview-detail">{dateLabel}</p>
      <p className="event-preview-detail">Ubicación · {form.location || '—'}</p>
      <p className="event-preview-detail">Cupo máximo · {form.maxCapacity || '—'}{form.maxCapacity ? ' personas' : ''}</p>
      <p className="event-preview-description">{form.description || 'La descripción del evento aparecerá en este espacio.'}</p>
      <p className="event-preview-organizer">Organiza · UMSSPIRA</p>
      <span className="event-preview-status">
        <span className="preview-status-desktop">VISTA PREVIA</span>
        <span className="preview-status-mobile">{hasErrors ? 'BORRADOR' : 'PUBLICADO'}</span>
      </span>
      <div className="event-preview-accent" />
    </aside>
  );
}

function FormField({
  label,
  required = false,
  optional = false,
  error,
  full = false,
  location = false,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  full?: boolean;
  location?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`event-field ${full ? 'is-full' : ''} ${location ? 'is-location' : ''} ${error ? 'has-error' : ''}`}>
      <label>{label}{optional ? ' (opcional)' : ''}{required ? ' *' : ''}</label>
      {children}
      {error && <p className="event-error" role="alert">{error}</p>}
    </div>
  );
}

function countValidationGroups(errors: EventFormErrors) {
  return Number(Boolean(errors.title))
    + Number(Boolean(errors.startDate))
    + Number(Boolean(errors.startTime))
    + Number(Boolean(errors.endDate || errors.endTime))
    + Number(Boolean(errors.maxCapacity));
}

function formatDateLabel(startDate: string, startTime: string, endDate: string, endTime: string) {
  if (!startDate) return 'Fecha por definir';

  const [year, month, day] = startDate.split('-').map(Number);
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const date = `${day} ${monthNames[month - 1] ?? ''} ${year}`;
  const times = startTime ? `${startTime}${endTime ? `–${endTime}` : ''}` : 'Hora por definir';

  if (endDate && endDate !== startDate) {
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    return `${date} · ${times} / ${endDay} ${monthNames[endMonth - 1] ?? ''} ${endYear}`;
  }

  return `${date} · ${times}`;
}

function formatFileDetails(file: File) {
  const extension = file.name.split('.').pop()?.toUpperCase() ?? 'ARCHIVO';
  const size = `${(file.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${extension} · ${size}`;
}

function createInitialState(event?: EventItem): EventFormState {
  if (!event) return initialState;

  const start = toDateTimeInputParts(event.startDate);
  const end = toDateTimeInputParts(event.endDate);

  return {
    title: event.title,
    description: event.description ?? '',
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    maxCapacity: String(event.maxCapacity),
    location: event.location ?? '',
    image: null,
  };
}

function toDateTimeInputParts(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    const [date = '', time = ''] = value.split('T');
    return {
      date,
      time: time.slice(0, 5),
    };
  }

  const date = [
    parsedDate.getFullYear(),
    String(parsedDate.getMonth() + 1).padStart(2, '0'),
    String(parsedDate.getDate()).padStart(2, '0'),
  ].join('-');
  const time = [
    String(parsedDate.getHours()).padStart(2, '0'),
    String(parsedDate.getMinutes()).padStart(2, '0'),
  ].join(':');

  return { date, time };
}
