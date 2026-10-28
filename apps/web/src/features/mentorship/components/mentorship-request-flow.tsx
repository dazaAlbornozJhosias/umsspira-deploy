'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  Clock3Icon,
  InfoIcon,
  LoaderCircleIcon,
  UserRoundIcon,
} from 'lucide-react';
import { ConfirmModal } from '@/shared/components/confirm-modal';
import { MentorSlotPicker } from './mentor-slot-picker';
import { PrimaryButton, SecondaryButton } from './mentor-button';
import { formatLongDate } from '../model/slot-calendar';
import {
  createMentorshipRequest,
  type DirectoryMentor,
  getMentorSlots,
  listMentorDirectory,
  type MentorSlot,
  type MentorSlotDay,
  MentorshipRequestError,
  REQUEST_MESSAGE_LIMIT,
  SLOT_UNAVAILABLE_MESSAGE,
} from '../services/mentorship-request-api';

const REQUIRED_MESSAGE = 'Faltan datos obligatorios. Revisa los campos marcados para continuar.';

export function MentorshipRequestFlow({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const [mentor, setMentor] = useState<DirectoryMentor | null>(null);
  const [days, setDays] = useState<MentorSlotDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<MentorshipRequestError | Error | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<MentorSlot | null>(null);
  const [message, setMessage] = useState('');
  const [showRequired, setShowRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [sent, setSent] = useState(false);
  const busy = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [directory, slots] = await Promise.all([listMentorDirectory(signal), getMentorSlots(mentorId, signal)]);
      if (signal?.aborted) return;
      const found = directory.find((entry) => entry.id === mentorId);
      if (!found) throw new Error('El mentor seleccionado no está disponible en el directorio.');
      setMentor(found);
      setDays(slots);
    } catch (reason) {
      if (signal?.aborted) return;
      setLoadError(reason instanceof Error ? reason : new Error('No se pudo cargar la solicitud.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function selectDate(value: string) {
    setDate(value);
    setSlot(null);
    setShowRequired(false);
  }

  function goToSummary() {
    if (!date || !slot) {
      setShowRequired(true);
      return;
    }
    setShowRequired(false);
    setSubmitError('');
    setStep(2);
  }

  async function confirm() {
    if (busy.current || !slot || !date) return;
    busy.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      await createMentorshipRequest({
        mentorId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        message: message.trim() || undefined,
      });
      setSent(true);
    } catch (reason) {
      if (reason instanceof MentorshipRequestError && reason.code === 'MENTOR_SLOT_UNAVAILABLE') setConflict(true);
      else setSubmitError(reason instanceof Error ? reason.message : 'No se pudo enviar la solicitud.');
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  function chooseAnotherSlot() {
    setConflict(false);
    setSlot(null);
    setStep(1);
    void load();
  }

  if (loading && !mentor) {
    return <p className="mentor-request-loading" role="status"><LoaderCircleIcon aria-hidden="true" /> Cargando horarios del mentor…</p>;
  }

  if (loadError) {
    const denied = loadError instanceof MentorshipRequestError && (loadError.status === 403 || loadError.status === 401);
    return (
      <div className="mentor-request-alert" role="alert">
        <InfoIcon aria-hidden="true" />
        <p>{loadError.message}</p>
        {denied
          ? <Link href="/mentorship" className="mentor-button mentor-button-secondary">Volver a Mentorías</Link>
          : <SecondaryButton onClick={() => void load()}>Reintentar</SecondaryButton>}
      </div>
    );
  }

  if (!mentor) return null;

  return (
    <section className="mentor-request-card" aria-labelledby="mentor-request-heading">
      <ol className="mentor-request-steps" aria-label="Pasos de la solicitud">
        <li aria-current={step === 1 ? 'step' : undefined} className={step === 1 ? 'is-current' : 'is-done'}>Paso 1: Horario y motivo</li>
        <li aria-current={step === 2 ? 'step' : undefined} className={step === 2 ? 'is-current' : ''}>Paso 2: Confirmación</li>
      </ol>

      <div className="mentor-request-mentor">
        <span aria-hidden="true" className="mentor-directory-avatar"><UserRoundIcon /></span>
        <div>
          <h2 id="mentor-request-heading">{mentor.name}</h2>
          {mentor.description && <p>{mentor.description}</p>}
          {mentor.areas.length > 0 && (
            <ul className="mentor-directory-areas" aria-label="Áreas del mentor">
              {mentor.areas.map((area) => <li key={area.id}>{area.name}</li>)}
            </ul>
          )}
        </div>
      </div>

      {step === 1 ? (
        <form noValidate onSubmit={(event) => { event.preventDefault(); goToSummary(); }}>
          {showRequired && <div className="mentor-request-alert" role="alert"><InfoIcon aria-hidden="true" /><p>{REQUIRED_MESSAGE}</p></div>}

          <fieldset className="mentor-request-fieldset">
            <legend>Fecha y horario <span aria-hidden="true">*</span></legend>
            <MentorSlotPicker
              days={days}
              selectedDate={date}
              selectedSlot={slot}
              invalid={showRequired && (!date || !slot)}
              onSelectDate={selectDate}
              onSelectSlot={(value) => { setSlot(value); setShowRequired(false); }}
            />
            {showRequired && !date && <p className="mentor-request-field-error">Selecciona una fecha.</p>}
            {showRequired && date && !slot && <p className="mentor-request-field-error">Selecciona un bloque de horario.</p>}
          </fieldset>

          <div className="mentor-request-field">
            <label htmlFor="mentor-request-message">Motivo de la mentoría <span>(opcional)</span></label>
            <textarea
              id="mentor-request-message"
              value={message}
              maxLength={REQUEST_MESSAGE_LIMIT}
              rows={4}
              placeholder="Cuéntale al mentor qué orientación técnica o profesional necesitas."
              onChange={(event) => setMessage(event.target.value.slice(0, REQUEST_MESSAGE_LIMIT))}
              aria-describedby="mentor-request-counter"
            />
            <p id="mentor-request-counter" className="mentor-request-counter">{message.length}/{REQUEST_MESSAGE_LIMIT}</p>
          </div>

          <div className="mentor-request-actions">
            <SecondaryButton onClick={() => router.back()}>Cancelar</SecondaryButton>
            <PrimaryButton type="submit" iconRight={ArrowRightIcon}>Continuar</PrimaryButton>
          </div>
        </form>
      ) : (
        <div>
          <h3 className="mentor-request-summary-title">Resumen de tu solicitud</h3>
          <dl className="mentor-request-summary">
            <div><dt><UserRoundIcon aria-hidden="true" /> Mentor</dt><dd>{mentor.name}</dd></div>
            <div><dt><CalendarDaysIcon aria-hidden="true" /> Fecha</dt><dd>{formatLongDate(date)}</dd></div>
            <div><dt><Clock3Icon aria-hidden="true" /> Horario</dt><dd>{slot?.startTime} – {slot?.endTime}</dd></div>
            <div><dt>Motivo</dt><dd>{message.trim() || 'Sin mensaje'}</dd></div>
          </dl>
          {submitError && <div className="mentor-request-alert" role="alert"><InfoIcon aria-hidden="true" /><p>{submitError}</p></div>}
          <div className="mentor-request-actions">
            <SecondaryButton onClick={() => { setSubmitError(''); setStep(1); }} disabled={submitting}>
              <ArrowLeftIcon className="icon" aria-hidden="true" /> Volver a editar
            </SecondaryButton>
            <PrimaryButton onClick={() => void confirm()} loading={submitting} loadingLabel="Enviando…">Confirmar solicitud</PrimaryButton>
          </div>
        </div>
      )}

      <ConfirmModal
        open={sent}
        icon={CheckCircle2Icon}
        eyebrow="Solicitud registrada"
        title="Solicitud enviada"
        description="Tu solicitud de mentoría fue enviada y se encuentra en estado Pendiente hasta que el mentor responda."
        cancelLabel="Volver al directorio"
        confirmLabel="Ver mis solicitudes"
        onCancel={() => router.push('/mentorship/directory')}
        onConfirm={() => router.push('/mentorship/requests')}
      />
      <ConfirmModal
        open={conflict}
        icon={AlertTriangleIcon}
        eyebrow="Horario ocupado"
        title={SLOT_UNAVAILABLE_MESSAGE}
        description="Otra persona reservó este bloque mientras confirmabas. Elige un nuevo horario para continuar."
        cancelLabel="Cerrar"
        confirmLabel="Seleccionar otro horario"
        onCancel={() => setConflict(false)}
        onConfirm={chooseAnotherSlot}
      />
    </section>
  );
}
