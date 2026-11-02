'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  EVENT_DATE_MAX_YEAR,
  EVENT_DATE_MIN_YEAR,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_MAX_CAPACITY,
  EVENT_STATUS,
  EVENT_TITLE_MAX_LENGTH,
  type CreateEventDto,
  type EventItem,
} from '@umsspira/shared-types';
import {
  EventConfirmDialog,
  type EventSummary,
} from '@/shared/components/events-ui';
import {
  formatEventInputSchedule,
  isEventInputDateValid,
  toDateTimeInputParts,
  toEventIsoDateTime,
} from '@/shared/utils/event-date-time';

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
  imageUrl: string | null;
}

interface EventFormErrors {
  title?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  maxCapacity?: string;
  location?: string;
}

type EventFormValidatedField = keyof EventFormErrors;
type TouchedEventFormFields = Partial<Record<EventFormValidatedField, boolean>>;

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
  showDraftSaveButton?: boolean;
  submitLabel?: string;
  capacityMinimum?: number;
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
  imageUrl: null,
};

const EVENT_TITLE_HAS_LETTER_PATTERN = new RegExp('\\p{L}', 'u');
const END_AFTER_START_MESSAGE = 'Debe ser posterior al inicio.';
const VALIDATED_FIELDS: EventFormValidatedField[] = [
  'title',
  'startDate',
  'startTime',
  'endDate',
  'endTime',
  'maxCapacity',
  'location',
];

export default function EventForm({
  onSubmit,
  onCancel,
  onValidationChange,
  isSubmitting = false,
  initialEvent,
  allowPublication = true,
  showDraftSaveButton = true,
  submitLabel = 'Publicar evento',
  capacityMinimum = 0,
}: EventFormProps) {
  const [form, setForm] = useState<EventFormState>(() =>
    createInitialState(initialEvent),
  );
  const [touchedFields, setTouchedFields] = useState<TouchedEventFormFields>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [pendingPublication, setPendingPublication] = useState<PendingPublication | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const validationErrors = useMemo(() => {
    const result = validateEventForm(form);
    const capacity = Number(form.maxCapacity);
    if (capacityMinimum > 0 && Number.isFinite(capacity) && capacity < capacityMinimum) {
      result.maxCapacity = `El cupo no puede ser menor a ${capacityMinimum} inscripciones confirmadas.`;
    }
    return result;
  }, [capacityMinimum, form]);
  const errors = useMemo(
    () => getVisibleErrors(validationErrors, touchedFields, showAllErrors),
    [showAllErrors, touchedFields, validationErrors],
  );
  const errorCount = countValidationControls(errors);
  const isBusy = isSubmitting || isSavingDraft;

  useEffect(() => {
    onValidationChange?.(errorCount);
  }, [errorCount, onValidationChange]);

  useEffect(() => {
    setForm(createInitialState(initialEvent));
    setTouchedFields({});
    setShowAllErrors(false);
    setImageError(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }, [initialEvent]);

  useEffect(() => {
    if (!form.image) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(form.image);
    setImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.image]);

  const dateLabel = useMemo(
    () => formatEventInputSchedule(form.startDate, form.startTime, form.endDate, form.endTime),
    [form.endDate, form.endTime, form.startDate, form.startTime],
  );

  const updateField = (field: keyof Omit<EventFormState, 'image' | 'imageUrl'>, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    if (field !== 'description') {
      setTouchedFields((current) => markFieldAsTouched(current, field, nextForm));
    }
  };

  const touchField = (field: EventFormValidatedField) => {
    setTouchedFields((current) => markFieldAsTouched(current, field, form));
  };

  const buildEventDto = (status: 'BORRADOR' | 'PUBLICADO'): CreateEventDto => ({
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    startDate: toEventIsoDateTime(form.startDate, form.startTime),
    endDate: toEventIsoDateTime(form.endDate, form.endTime),
    maxCapacity: Number(form.maxCapacity),
    location: form.location.trim() || undefined,
    status,
  });

  const validateForm = () => {
    setShowAllErrors(true);
    return countValidationControls(validationErrors) === 0 && !imageError;
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

    if (!allowPublication) {
      void onSubmit(buildEventDto(EVENT_STATUS.BORRADOR), form.image);
      return;
    }

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
                onBlur={() => touchField('title')}
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
              <input type="date" min="1900-01-01" max="2100-12-31" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} onBlur={() => touchField('startDate')} />
            </FormField>
            <FormField label="Hora de inicio" required error={errors.startTime}>
              <input type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} onBlur={() => touchField('startTime')} />
            </FormField>
            <FormField label="Fecha de finalización" required error={errors.endDate}>
              <input type="date" min="1900-01-01" max="2100-12-31" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} onBlur={() => touchField('endDate')} />
            </FormField>
            <FormField label="Hora de finalización" required error={errors.endTime}>
              <input type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} onBlur={() => touchField('endTime')} />
            </FormField>
            <FormField label="Ubicación" optional error={errors.location} location>
              <input
                type="text"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                onBlur={() => touchField('location')}
                placeholder="Ej. Auditorio Central UMSS"
              />
            </FormField>
          </section>

          <section className="event-mobile-section">
            <h3 className="event-mobile-section-title">3 Capacidad y portada</h3>
            <FormField label="Cupo máximo" required error={errors.maxCapacity}>
              <input
                type="text"
                inputMode="numeric"
                value={form.maxCapacity}
                onChange={(event) => updateField('maxCapacity', event.target.value)}
                onBlur={() => touchField('maxCapacity')}
                placeholder="Ej. 150"
              />
            </FormField>

            <div className="event-field event-image-field">
              <label htmlFor="event-image">Imagen de portada (opcional)</label>
              <label className="event-image-control" htmlFor="event-image">
                <strong>{form.image ? form.image.name : form.imageUrl ? getStoredImageName(form.imageUrl) : 'Seleccionar imagen'}</strong>
                <span>{form.image ? `Imagen seleccionada · ${formatFileDetails(form.image)}` : form.imageUrl ? 'Portada guardada' : 'JPG, PNG o WebP · máximo 5 MB'}</span>
              </label>
              {imageError ? <p className="event-error" role="alert">{imageError}</p> : null}
              <input
                id="event-image"
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  const image = event.target.files?.[0] ?? null;
                  const error = getImageValidationError(image);
                  if (error) {
                    event.target.value = '';
                    setImageError(error);
                    setForm((current) => ({ ...current, image: null }));
                    return;
                  }
                  setImageError(null);
                  setForm((current) => ({ ...current, image }));
                }}
              />
            </div>
          </section>
        </div>

        <div className="event-form-actions event-form-actions-desktop">
          <button type="button" className="event-button event-button-secondary" onClick={onCancel} disabled={isBusy}>Cancelar</button>
          {showDraftSaveButton ? <button type="button" className="event-button event-button-secondary" onClick={() => void saveDraft()} disabled={isBusy}>
            {isSavingDraft ? 'Guardando…' : 'Guardar borrador'}
          </button> : null}
          {allowPublication ? (
            <button type="submit" className="event-button event-button-primary" disabled={isBusy}>{submitLabel}</button>
          ) : !showDraftSaveButton ? (
            <button type="submit" className="event-button event-button-primary" disabled={isBusy}>{isSubmitting ? 'Guardando…' : submitLabel}</button>
          ) : null}
        </div>
      </form>

      <EventPreview
        form={form}
        dateLabel={dateLabel}
        hasErrors={errorCount > 0}
        imagePreviewUrl={imagePreviewUrl}
      />

      <div className="event-form-actions event-form-actions-mobile">
        <button type="button" className="event-button event-button-secondary" onClick={onCancel} disabled={isBusy}>Cancelar</button>
        {showDraftSaveButton ? <button type="button" className="event-button event-button-secondary" onClick={() => void saveDraft()} disabled={isBusy}>
          {isSavingDraft ? 'Guardando…' : 'Guardar borrador'}
        </button> : null}
        {allowPublication ? (
          <button type="submit" form="event-create-form" className="event-button event-button-primary" disabled={isBusy}>{isSubmitting ? 'Guardando…' : 'Publicar'}</button>
        ) : !showDraftSaveButton ? (
          <button type="submit" form="event-create-form" className="event-button event-button-primary" disabled={isBusy}>{isSubmitting ? 'Guardando…' : submitLabel}</button>
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

function EventPreview({ form, dateLabel, hasErrors, imagePreviewUrl }: { form: EventFormState; dateLabel: string; hasErrors: boolean; imagePreviewUrl: string | null }) {
  const coverSrc = imagePreviewUrl ?? form.imageUrl;

  return (
    <aside className="event-preview-card" aria-label="Vista previa del evento">
      <h2>Vista previa</h2>
      <p>Así se verá al publicarlo</p>
      <div
        className={`event-preview-cover ${coverSrc ? 'has-image' : ''}`}
        role={coverSrc ? 'img' : undefined}
        aria-label={coverSrc ? `Portada de ${form.title || 'evento'}` : undefined}
        style={coverSrc ? {
          backgroundImage: `url("${coverSrc}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <span>{form.title || 'Evento universitario'}</span>
      </div>
      <h3>{form.title || 'Título del evento'}</h3>
      <p className="event-preview-detail">{dateLabel}</p>
      <p className="event-preview-detail">Ubicación · {form.location || '—'}</p>
      <p className="event-preview-detail">Cupo máximo · {form.maxCapacity || '—'}{form.maxCapacity ? ` ${form.maxCapacity === '1' ? 'persona' : 'personas'}` : ''}</p>
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

function countValidationControls(errors: EventFormErrors) {
  return Number(Boolean(errors.title))
    + Number(Boolean(errors.startDate))
    + Number(Boolean(errors.startTime))
    + Number(Boolean(errors.endDate))
    + Number(Boolean(errors.endTime))
    + Number(Boolean(errors.maxCapacity))
    + Number(Boolean(errors.location));
}

function validateEventForm(form: EventFormState): EventFormErrors {
  const nextErrors: EventFormErrors = {};
  const title = form.title.trim();

  if (!title) {
    nextErrors.title = 'Este campo es obligatorio.';
  } else if (title.length > EVENT_TITLE_MAX_LENGTH) {
    nextErrors.title = `El título no puede superar los ${EVENT_TITLE_MAX_LENGTH} caracteres.`;
  } else if (!EVENT_TITLE_HAS_LETTER_PATTERN.test(title)) {
    nextErrors.title = 'El título debe contener al menos una letra.';
  }

  if (!form.startDate) {
    nextErrors.startDate = 'Este campo es obligatorio.';
  } else if (!isEventInputDateValid(form.startDate)) {
    nextErrors.startDate = `Ingresa una fecha válida entre ${EVENT_DATE_MIN_YEAR} y ${EVENT_DATE_MAX_YEAR}.`;
  }
  if (!form.startTime) nextErrors.startTime = 'Este campo es obligatorio.';
  if (!form.endDate) {
    nextErrors.endDate = 'Este campo es obligatorio.';
  } else if (!isEventInputDateValid(form.endDate)) {
    nextErrors.endDate = `Ingresa una fecha válida entre ${EVENT_DATE_MIN_YEAR} y ${EVENT_DATE_MAX_YEAR}.`;
  }
  if (!form.endTime) nextErrors.endTime = 'Este campo es obligatorio.';

  if (form.location.trim().length > EVENT_LOCATION_MAX_LENGTH) {
    nextErrors.location = `La ubicación no puede superar los ${EVENT_LOCATION_MAX_LENGTH} caracteres.`;
  }

  const capacity = Number(form.maxCapacity);
  if (
    !form.maxCapacity
    || !/^\d+$/.test(form.maxCapacity)
    || !Number.isFinite(capacity)
    || !Number.isInteger(capacity)
    || capacity < 1
    || capacity > EVENT_MAX_CAPACITY
  ) {
    nextErrors.maxCapacity = 'El cupo máximo debe ser un número entero entre 1 y 10000.';
  }

  if (
    !nextErrors.startDate
    && !nextErrors.startTime
    && !nextErrors.endDate
    && !nextErrors.endTime
  ) {
    const startDateTime = new Date(`${form.startDate}T${form.startTime}:00`);
    const endDateTime = new Date(`${form.endDate}T${form.endTime}:00`);

    if (endDateTime <= startDateTime) {
      nextErrors.endDate = END_AFTER_START_MESSAGE;
      nextErrors.endTime = END_AFTER_START_MESSAGE;
    }
  }

  return nextErrors;
}

function getVisibleErrors(
  validationErrors: EventFormErrors,
  touchedFields: TouchedEventFormFields,
  showAllErrors: boolean,
): EventFormErrors {
  return VALIDATED_FIELDS.reduce<EventFormErrors>((visibleErrors, field) => {
    if ((showAllErrors || touchedFields[field]) && validationErrors[field]) {
      visibleErrors[field] = validationErrors[field];
    }
    return visibleErrors;
  }, {});
}

function markFieldAsTouched(
  current: TouchedEventFormFields,
  field: EventFormValidatedField,
  form: EventFormState,
): TouchedEventFormFields {
  const next = { ...current, [field]: true };

  if (isScheduleField(field) && hasCompleteSchedule(form)) {
    const scheduleErrors = validateEventForm(form);
    if (scheduleErrors.endDate === END_AFTER_START_MESSAGE) {
      next.endDate = true;
      next.endTime = true;
    }
  }

  return next;
}

function isScheduleField(field: EventFormValidatedField): boolean {
  return field === 'startDate'
    || field === 'startTime'
    || field === 'endDate'
    || field === 'endTime';
}

function hasCompleteSchedule(form: EventFormState): boolean {
  return Boolean(form.startDate && form.startTime && form.endDate && form.endTime);
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
    imageUrl: event.imageUrl ?? null,
  };
}

function getImageValidationError(file: File | null): string | null {
  if (!file) return null;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Formato no admitido. Solo se permiten imágenes JPG, PNG o WebP.';
  }
  if (file.size > 5 * 1024 * 1024) return 'La imagen no puede superar los 5 MB.';
  return null;
}

function getStoredImageName(imageUrl: string): string {
  try {
    const filename = new URL(imageUrl).pathname.split('/').pop();
    return decodeURIComponent(filename ?? 'Portada guardada').replace(/^[0-9a-f-]{36}-/i, '');
  } catch {
    return 'Portada guardada';
  }
}
