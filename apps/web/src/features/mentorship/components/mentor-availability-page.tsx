'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CirclePauseIcon,
  CircleSlash2Icon,
  Clock3Icon,
  InfoIcon,
  LoaderCircleIcon,
  XIcon,
} from 'lucide-react';
import { ConfirmModal } from '@/shared/components/confirm-modal';
import { PrimaryButton, SecondaryButton } from './mentor-button';
import {
  getMentorAvailability,
  MentorAvailabilityError,
  type MentorAvailabilityStatus,
  updateMentorAvailability,
} from '../services/mentor-availability-api';

const options: {
  status: MentorAvailabilityStatus;
  title: string;
  description: string;
  visibility: string;
  icon: typeof CheckCircle2Icon;
}[] = [
  {
    status: 'AVAILABLE',
    title: 'Disponible',
    description: 'Tu perfil es visible en el directorio y los estudiantes pueden solicitar orientación.',
    visibility: 'Visible en el directorio',
    icon: CheckCircle2Icon,
  },
  {
    status: 'PAUSED',
    title: 'Pausar disponibilidad',
    description: 'Suspende temporalmente el ingreso de nuevas solicitudes sin perder tu configuración.',
    visibility: 'Nuevas solicitudes pausadas',
    icon: CirclePauseIcon,
  },
  {
    status: 'UNAVAILABLE',
    title: 'No disponible',
    description: 'Indica que por ahora no deseas recibir mentorías y oculta temporalmente tu ficha del directorio.',
    visibility: 'Oculto del directorio',
    icon: CircleSlash2Icon,
  },
];

const statusLabels: Record<MentorAvailabilityStatus, string> = {
  AVAILABLE: 'Mentor disponible',
  PAUSED: 'Mentor en pausa',
  UNAVAILABLE: 'Mentor no disponible',
};

const successMessages: Record<MentorAvailabilityStatus, string> = {
  AVAILABLE: 'Disponibilidad activada correctamente',
  PAUSED: 'Disponibilidad pausada correctamente',
  UNAVAILABLE: 'Estado actualizado correctamente',
};

function wait(milliseconds: number) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

export function MentorAvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savedStatus, setSavedStatus] = useState<MentorAvailabilityStatus | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MentorAvailabilityStatus | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<MentorAvailabilityStatus | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [toast, setToast] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const busy = useRef(false);
  const dirty = selectedStatus !== savedStatus;

  const loadAvailability = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const state = await getMentorAvailability(signal);
      if (signal?.aborted) return;
      setSavedStatus(state.availabilityStatus);
      setSelectedStatus(state.availabilityStatus);
      setForbidden(false);
      setLoadFailed(false);
    } catch (reason) {
      if (signal?.aborted) return;
      const denied = reason instanceof MentorAvailabilityError && reason.status === 403;
      setForbidden(denied);
      setLoadFailed(true);
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la disponibilidad.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadAvailability(controller.signal);
    return () => controller.abort();
  }, [loadAvailability]);

  useEffect(() => {
    if (!forbidden) return;
    const timeout = window.setTimeout(() => router.replace('/'), 2500);
    return () => window.clearTimeout(timeout);
  }, [forbidden, router]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  function choose(status: MentorAvailabilityStatus) {
    if (busy.current || saving || loadFailed) return;
    setError('');
    setBanner('');
    setToast('');
    setSavedFeedback(false);
    if (status === 'AVAILABLE') {
      setSelectedStatus(status);
      return;
    }
    setConfirmStatus(status);
  }

  async function save() {
    if (busy.current || !selectedStatus || !dirty || loading || forbidden) return;
    busy.current = true;
    const startedAt = Date.now();
    setSaving(true);
    setError('');
    setBanner('');
    setToast('');
    setSavedFeedback(false);

    try {
      const state = await updateMentorAvailability(selectedStatus);
      setSavedStatus(state.availabilityStatus);
      setSelectedStatus(state.availabilityStatus);
      setBanner(successMessages[state.availabilityStatus ?? selectedStatus]);
      if (selectedStatus === 'UNAVAILABLE') setToast('Disponibilidad actualizada con éxito');
      setSavedFeedback(true);
      window.setTimeout(() => setSavedFeedback(false), 1800);
    } catch (reason) {
      setError(reason instanceof Error
        ? reason.message
        : 'No se pudo actualizar la disponibilidad. Inténtalo de nuevo.');
      if (reason instanceof MentorAvailabilityError && reason.status === 403) setForbidden(true);
    } finally {
      const remaining = 1000 - (Date.now() - startedAt);
      if (remaining > 0) await wait(remaining);
      setSaving(false);
      busy.current = false;
    }
  }

  function discard() {
    if (busy.current) return;
    setSelectedStatus(savedStatus);
    setError('');
    setBanner('');
    setToast('');
    setSavedFeedback(false);
  }

  if (forbidden) {
    return <div className="mentor-availability-denied" role="alert">
      <InfoIcon aria-hidden="true" />
      <p>Acceso denegado. Serás redirigido al inicio.</p>
    </div>;
  }

  return <>
    <section className="mentor-availability-card" aria-labelledby="mentor-availability-heading">
      <div className="mentor-availability-intro">
        <div className="mentor-availability-statuses" aria-live="polite">
          <span className={`mentor-availability-chip${savedStatus ? ` is-${savedStatus.toLowerCase()}` : ''}`}>
            {loadFailed ? 'Estado no disponible' : loading ? 'Cargando disponibilidad…' : savedStatus ? statusLabels[savedStatus] : 'Disponibilidad sin configurar'}
          </span>
          <span className="mentor-availability-chip mentor-availability-chip-approved">
            <CheckCircle2Icon aria-hidden="true" /> Titulado aprobado
          </span>
        </div>
        <div className="mentor-availability-notice">
          <InfoIcon aria-hidden="true" />
          <div>
            <strong>Define tu disponibilidad en el directorio de mentorías</strong>
            <p>Puedes cambiar de estado en cualquier momento sin perder tus áreas técnicas, intereses ni datos configurados previamente.</p>
          </div>
        </div>
        {banner && <div className="mentor-availability-banner" role="status">
          <CheckCircle2Icon aria-hidden="true" />
          <div><strong>{banner}</strong><p>Tu estado guardado ya está actualizado.</p></div>
          <button type="button" aria-label="Cerrar mensaje" onClick={() => setBanner('')}><XIcon aria-hidden="true" /></button>
        </div>}
        {error && <div className="mentor-availability-error" role="alert">
          <p>{error}</p>
          {loadFailed && !forbidden && !saving && <SecondaryButton onClick={() => void loadAvailability()} disabled={loading}>Reintentar</SecondaryButton>}
        </div>}
      </div>

      <div className="mentor-availability-section-heading">
        <h2 id="mentor-availability-heading">Estado de disponibilidad</h2>
        <span><i aria-hidden="true" />{loadFailed ? 'Estado no disponible' : selectedStatus ? dirty ? 'Cambio pendiente de guardar' : 'Estado guardado' : 'Selecciona una opción'}</span>
      </div>

      {loading ? <p className="mentor-availability-loading" role="status"><LoaderCircleIcon aria-hidden="true" /> Cargando disponibilidad…</p> : (
        <div className="mentor-availability-options" role="group" aria-label="Selecciona tu disponibilidad">
          {options.map(({ status, title, description, visibility, icon: Icon }) => {
            const selected = selectedStatus === status;
            return <article key={status} className={`mentor-availability-option${selected ? ` is-selected is-${status.toLowerCase()}` : ''}`}>
              <div className="mentor-availability-option-top">
                <span className="mentor-availability-option-icon"><Icon aria-hidden="true" /></span>
                <button type="button" className={selected ? 'mentor-availability-selected' : 'mentor-availability-choose'} onClick={() => choose(status)} disabled={saving || loadFailed} aria-pressed={selected}>
                  {selected ? <><CheckCircle2Icon aria-hidden="true" /> Seleccionado</> : 'Elegir'}
                </button>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="mentor-availability-option-footer"><span>{status === 'AVAILABLE' ? 'Directorio público' : 'Nuevas solicitudes'}</span><strong>{visibility.replace(' en el directorio', '').replace(' del directorio', '')}</strong></div>
            </article>;
          })}
        </div>
      )}

      <section className="mentor-availability-schedule" aria-labelledby="mentor-availability-schedule-title">
        <div className="mentor-availability-schedule-heading">
          <span className="mentor-availability-schedule-icon"><CalendarDaysIcon aria-hidden="true" /></span>
          <div><h2 id="mentor-availability-schedule-title">Horarios y calendario semanal</h2><p>Más adelante podrás configurar días y horarios específicos para tus mentorías.</p></div>
          <span className="mentor-availability-coming-soon">Próximamente</span>
        </div>
        <div className="mentor-availability-week" aria-label="Vista previa de la configuración semanal, próximamente">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => <div key={day} aria-disabled="true"><strong>{day}</strong><span><Clock3Icon aria-hidden="true" /> Próximamente</span></div>)}
        </div>
      </section>

      <div className="mentor-availability-actions">
        <Link href="/mentorship/profile" className="mentor-availability-back" onClick={event => {
          if (dirty) {
            event.preventDefault();
            setConfirmDiscard(true);
          }
        }}><ArrowLeftIcon aria-hidden="true" /> Volver a Mi perfil de mentor</Link>
        <div className="mentor-availability-action-buttons">
          {dirty && <SecondaryButton onClick={discard} disabled={saving}>Descartar cambios</SecondaryButton>}
          <PrimaryButton onClick={() => void save()} disabled={!dirty || !selectedStatus || loading || loadFailed || saving} loading={saving} loadingLabel="Guardando…" iconRight={savedFeedback ? CheckCircle2Icon : ArrowRightIcon} className={`mentor-availability-save${savedFeedback ? ' is-saved' : ''}`}>
            {savedFeedback ? '¡Guardado!' : 'Guardar disponibilidad'}
          </PrimaryButton>
        </div>
      </div>
      {!selectedStatus && !loading && !loadFailed && <p className="mentor-availability-help">Selecciona un estado para habilitar el guardado.</p>}
      {dirty && <p className="mentor-availability-help">Tienes cambios sin guardar.</p>}
    </section>

    {toast && <div className="mentor-availability-toast" role="status"><CheckCircle2Icon aria-hidden="true" /><span>{toast}</span><button type="button" aria-label="Cerrar notificación" onClick={() => setToast('')}><XIcon aria-hidden="true" /></button></div>}

    <ConfirmModal
      open={confirmDiscard}
      icon={InfoIcon}
      eyebrow="Cambios sin guardar"
      title="¿Descartar cambios de disponibilidad?"
      description="Si sales ahora, se restaurará la última disponibilidad guardada."
      cancelLabel="Seguir editando"
      confirmLabel="Descartar cambios"
      onCancel={() => setConfirmDiscard(false)}
      onConfirm={() => {
        discard();
        setConfirmDiscard(false);
        router.push('/mentorship/profile');
      }}
    />
    <ConfirmModal
      open={confirmStatus !== null}
      icon={confirmStatus === 'PAUSED' ? CirclePauseIcon : CircleSlash2Icon}
      eyebrow="Confirmación de estado"
      title={confirmStatus === 'PAUSED' ? '¿Deseas pausar tu disponibilidad temporalmente?' : '¿Deseas marcarte como no disponible?'}
      description={confirmStatus === 'PAUSED'
        ? 'Tu perfil dejará de recibir nuevas solicitudes mientras dure la pausa.'
        : 'Tu ficha dejará de aparecer en el directorio y no recibirás nuevas solicitudes hasta que cambies tu estado.'}
      cancelLabel="Cancelar y seguir editando"
      confirmLabel={confirmStatus === 'PAUSED' ? 'Sí, pausar disponibilidad' : 'Sí, marcar como no disponible'}
      onCancel={() => setConfirmStatus(null)}
      onConfirm={() => {
        if (confirmStatus) setSelectedStatus(confirmStatus);
        setConfirmStatus(null);
      }}
    >
      <div className="mentor-availability-modal-note"><CheckCircle2Icon aria-hidden="true" /><span>Tus áreas técnicas, intereses e información del perfil se conservan.</span></div>
    </ConfirmModal>
  </>;
}
