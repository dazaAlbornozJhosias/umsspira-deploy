'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, PlusIcon, AlertTriangleIcon, Undo2Icon, ShieldCheckIcon, LockKeyholeIcon, BriefcaseBusinessIcon, ServerIcon, MonitorIcon, DatabaseIcon, CloudIcon, BrainCircuitIcon, SmartphoneIcon, NetworkIcon, BlocksIcon, ClipboardCheckIcon } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/confirm-modal';
import { SecondaryButton, PrimaryButton } from './mentor-button';
import { getMentorProfile } from '../services/mentorship-api';
import type { MentorState } from '@umsspira/shared-types';
import { getMentorAreas, updateMentorAreas, MentorAreasError, type MentorArea, type MentorAreasState } from '../services/mentor-areas-api';

const MAX_AREAS = 5;

function areaIcon(name: string) {
  const value = name.toLocaleLowerCase('es');
  if (/base.*datos/.test(value)) return DatabaseIcon;
  if (/seguridad/.test(value)) return ShieldCheckIcon;
  if (/nube|devops|cloud/.test(value)) return CloudIcon;
  if (/inteligencia|ciencia.*datos|\bia\b/.test(value)) return BrainCircuitIcon;
  if (/móvil|movil/.test(value)) return SmartphoneIcon;
  if (/redes/.test(value)) return NetworkIcon;
  if (/arquitectura/.test(value)) return BlocksIcon;
  if (/backend/.test(value)) return ServerIcon;
  if (/frontend|web/.test(value)) return MonitorIcon;
  if (/calidad|testing/.test(value)) return ClipboardCheckIcon;
  return BriefcaseBusinessIcon;
}

function sortedUniqueAreas(areas: MentorArea[]): MentorArea[] {
  const unique = new Map<string, MentorArea>();
  for (const area of areas) {
    const key = area.nombre.trim().toLocaleLowerCase('es');
    if (key && !unique.has(key)) unique.set(key, area);
  }
  return Array.from(unique.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function MentorAreasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [areas, setAreas] = useState<MentorArea[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [catalogFromDatabase, setCatalogFromDatabase] = useState(false);
  const [limitError, setLimitError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [interests, setInterests] = useState<MentorAreasState['intereses']>();
  const [dialog, setDialog] = useState<'discard' | 'dependencies' | 'minimum' | null>(null);
  const [participation, setParticipation] = useState<MentorState | null>(null);
  const [destination, setDestination] = useState('/mentorship/profile');
  const busy = useRef(false);
  const dirty = savedIds.length !== selectedIds.length || savedIds.some(id => !selectedIds.includes(id));
  const removedIds = savedIds.filter(id => !selectedIds.includes(id));
  const addedIds = selectedIds.filter(id => !savedIds.includes(id));
  const changedCount = addedIds.length + removedIds.length;
  const valid = selectedIds.length >= 1 && selectedIds.length <= MAX_AREAS;

  async function loadAreas() {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const state = await getMentorAreas();
      setAreas(sortedUniqueAreas(state.areas));
      setSavedIds(state.selectedIds);
      setSelectedIds(state.selectedIds);
      setCatalogFromDatabase(true);
      setInterests(state.intereses);
      setForbidden(false);
    } catch (reason) {
      setAreas([]);
      setSavedIds([]);
      setSelectedIds([]);
      setCatalogFromDatabase(false);
      setForbidden(reason instanceof MentorAreasError && reason.status === 403);
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el catálogo de áreas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAreas();
    const controller = new AbortController();
    getMentorProfile(controller.signal).then(state => { if (!controller.signal.aborted) setParticipation(state); }).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!forbidden) return;
    const timeout = window.setTimeout(() => router.replace('/'), 2000);
    return () => window.clearTimeout(timeout);
  }, [forbidden, router]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      if (link.origin !== window.location.origin || link.pathname === window.location.pathname && link.search === window.location.search) return;
      event.preventDefault(); event.stopPropagation();
      if (!busy.current) { setDestination(link.pathname + link.search + link.hash); setDialog('discard'); }
    };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', click, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); };
  }, [dirty]);

  function cancel() {
    if (dirty) { setDestination('/mentorship/profile'); setDialog('discard'); return; }
    setSelectedIds(savedIds);
    setError('');
    setSaved(false);
    router.push('/mentorship/profile');
  }

  function toggleArea(id: string) {
    if (busy.current) return;
    setSaved(false);
    setLimitError('');
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      if (selectedIds.length === 1) setDialog('minimum');
    }
    else if (selectedIds.length >= MAX_AREAS) setLimitError('Puedes seleccionar como máximo 5 áreas técnicas');
    else setSelectedIds([...selectedIds, id]);
  }

  async function save() {
    if (busy.current || !valid || !catalogFromDatabase || forbidden) return;
    busy.current = true;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const state = await updateMentorAreas(selectedIds);
      setAreas(sortedUniqueAreas(state.areas));
      setSavedIds(state.selectedIds);
      setSelectedIds(state.selectedIds);
      setSaved(true);
      setInterests(state.intereses);
      setDialog(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron guardar las áreas.');
      if (reason instanceof MentorAreasError && reason.status === 403) setForbidden(true);
    } finally {
      setSaving(false);
      busy.current = false;
    }
  }


  if (forbidden) return <main className="mentorship-shell"><p role="alert">No tienes permisos para acceder a esta sección</p></main>;

  return (
    <main className="mentorship-shell mentor-areas-page">
      <nav aria-label="Ruta de navegación" className="mentorship-breadcrumb">
        <ol className="breadcrumb-list">
          <li><Link href="/" className="breadcrumb-link">Inicio</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/mentorship" className="breadcrumb-link">Mentorías</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/mentorship/profile" className="breadcrumb-link">Mi perfil de mentor</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="breadcrumb-current">Configurar áreas técnicas</li>
        </ol>
      </nav>

      <p className="page-eyebrow">Red universitaria de desarrollo</p>
      <h1 className="page-title page-title-with-eyebrow mentor-areas-page-title">Áreas técnicas de especialidad</h1>
      <p className="page-description">
        Selecciona las áreas técnicas en las que tienes experiencia para indicar los campos en los que puedes brindar orientación técnica en la red de mentorías.
      </p>

      <section className="mentor-areas-page-card" aria-labelledby="mentor-areas-page-heading">
        <div className="areas-participation-bar">
          <div><ShieldCheckIcon className="icon" aria-hidden="true" /><span><small>Estado de participación</small><strong>{participation ? participation.isActive ? 'Mentor habilitado' : 'Participación inactiva' : 'Participación por consultar'}</strong></span></div>
          <span className="areas-official-chip"><LockKeyholeIcon size={12} aria-hidden="true" /> Catálogo oficial controlado</span>
        </div>
        <div className="mentor-areas-page-banner">
          <BriefcaseBusinessIcon className="areas-banner-icon" aria-hidden="true" />
          <h2 id="mentor-areas-page-heading">Define tus especialidades para el directorio de mentorías</h2>
          <p>Las áreas técnicas provienen del catálogo aprobado de la UMSS. Debes seleccionar al menos un área técnica.</p>
        </div>

        <div className="mentor-areas-page-list-heading">
          <h2>Catálogo de especialidades técnicas (selección múltiple)</h2>
          <span className="mentor-areas-count" aria-live="polite">
            {selectedIds.length} de {MAX_AREAS} áreas seleccionadas
          </span>
        </div>

        {loading && <p className="mentor-areas-message" role="status">Cargando catálogo…</p>}
        {error && dialog !== 'dependencies' && <div className="mentor-areas-error" role="alert">
          <p>{error}</p>
          {error.startsWith('Inicia sesión') && <Link href="/login" className="mentor-button mentor-button-secondary">Iniciar sesión</Link>}
          {!catalogFromDatabase && <SecondaryButton disabled={saving || loading} onClick={() => void loadAreas()}>Reintentar</SecondaryButton>}
        </div>}
        {!loading && catalogFromDatabase && areas.length === 0 && <p role="alert" className="mentor-areas-message">No hay áreas técnicas disponibles. Contacta al administrador</p>}
        {!loading && catalogFromDatabase && areas.length > 0 && selectedIds.length === 0 && <div className="areas-minimum-notice"><p role="alert">Debes seleccionar al menos un área técnica</p><button type="button" onClick={() => setDialog('minimum')}>Ver requisito de selección</button></div>}
        {limitError && <p role="alert">{limitError}</p>}
        {!loading && areas.length > 0 && (
          <ul className="mentor-areas-list" aria-label="Catálogo de áreas técnicas">
            {areas.map(area => {
              const selected = selectedIds.includes(area.id);
              const AreaIcon = areaIcon(area.nombre);
              return (
                <li key={area.id}>
                  <label
                    className={`mentor-area-option${selected ? ' is-selected' : ''}`}
                  >
                    <input type="checkbox" aria-label={area.nombre} checked={selected} onChange={() => toggleArea(area.id)} disabled={saving} />
                    <span className="areas-category-icon" aria-hidden="true"><AreaIcon size={20} /></span>
                    <span className="mentor-area-option-copy">
                      <span className="mentor-area-name">{area.nombre}</span>
                      {area.descripcion && <span className="mentor-area-description">{area.descripcion}</span>}
                    </span>
                    <span className="mentor-area-option-state">
                      {selected
                        ? <><CheckIcon aria-hidden="true" className="icon-small" /> Seleccionada</>
                        : <><PlusIcon aria-hidden="true" className="icon-small" /> Agregar</>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {saved && <div role="status" className="mentor-areas-saved"><p>Áreas técnicas actualizadas correctamente</p><p>Áreas guardadas: {areas.filter(area => savedIds.includes(area.id)).map(area => area.nombre).join(', ')}</p></div>}

        <section className="areas-setup-progress" aria-labelledby="areas-progress-title">
          <div><h2 id="areas-progress-title">Completa tu perfil de mentor</h2><span>{savedIds.length ? 'Áreas técnicas guardadas' : 'En edición'}</span></div>
          <div className="areas-progress-track" aria-hidden="true"><span style={{ width: savedIds.length ? '33.333%' : '0%' }} /></div>
          <ol><li aria-current="step"><span className="areas-step-number">1</span><div><small>Paso actual · En edición</small><strong>Áreas técnicas</strong></div></li>
            <li><span className="areas-step-number">2</span><div><small>Paso 2</small><strong>Intereses de mentoría</strong></div></li>
            <li><span className="areas-step-number">3</span><div><small>Paso 3</small><strong>Disponibilidad horaria</strong></div></li></ol>
        </section>

        <div className="mentor-areas-page-actions">
          <Link href="/mentorship/profile" className="mentor-areas-back">
            <ArrowLeftIcon aria-hidden="true" className="icon-small" /> Volver a Mi perfil
          </Link>
          <div className="mentor-areas-actions">
            <SecondaryButton onClick={cancel} disabled={saving || loading}>Cancelar</SecondaryButton>
            <PrimaryButton onClick={() => {
              if (removedIds.length && (interests === undefined || interests.some(interest => removedIds.includes(interest.id_area)))) setDialog('dependencies');
              else void save();
            }} disabled={loading || saving || !valid || !catalogFromDatabase || areas.length === 0 || !dirty}>
              {saving ? 'Guardando…' : 'Guardar'}
            </PrimaryButton>
          </div>
        </div>
        <p className="areas-footer-note">Mínimo 1 área técnica y máximo 5. {dirty ? 'Cambios sin guardar.' : saved ? 'Especialidades guardadas.' : 'Selecciona tus especialidades del catálogo oficial.'}</p>
      </section>
      <ConfirmModal className="mentor-areas-modal" open={dialog === 'discard'} icon={Undo2Icon} eyebrow="Cambios sin guardar" title="Descartar cambios en áreas técnicas" description="Tienes cambios sin guardar. ¿Deseas descartarlos?" cancelLabel="Seguir editando" confirmLabel="Descartar cambios" onCancel={() => setDialog(null)} onConfirm={() => { setSelectedIds(savedIds); setDialog(null); router.push(destination); }}>
        <div className="areas-modal-hero"><Undo2Icon aria-hidden="true" /><strong>¿Quieres descartar los {changedCount} cambios realizados?</strong></div>
        <ul className="areas-change-list">{addedIds.map(id => <li key={id}><PlusIcon size={16} aria-hidden="true" /><strong>{areas.find(area => area.id === id)?.nombre}</strong><span>Se quitará</span></li>)}
          {removedIds.map(id => <li key={id}><Undo2Icon size={16} aria-hidden="true" /><strong>{areas.find(area => area.id === id)?.nombre}</strong><span>Se restaurará</span></li>)}</ul>
      </ConfirmModal>
      <ConfirmModal className="mentor-areas-modal" open={dialog === 'minimum'} icon={ShieldCheckIcon} eyebrow="Aviso del sistema" title="Selección obligatoria de áreas técnicas" description="Debes seleccionar al menos un área técnica" cancelLabel="Revisar catálogo" confirmLabel="Entendido / Continuar" onCancel={() => setDialog(null)} onConfirm={() => setDialog(null)}>
        <div className="areas-modal-hero"><LockKeyholeIcon aria-hidden="true" /><strong>Debes seleccionar al menos una (1) área técnica</strong><p>Para guardar tu configuración necesitas contar con al menos una especialidad técnica del catálogo oficial.</p></div>
      </ConfirmModal>
      <ConfirmModal open={dialog === 'dependencies'} icon={AlertTriangleIcon} title="Revisar intereses dependientes" description={removedIds.map(id => {
        const name = areas.find(area => area.id === id)?.nombre || id;
        const names = interests?.filter(interest => interest.id_area === id).map(interest => interest.nombre);
        return <p key={id}>{names?.length ? `Al quitar ${name} también se eliminarán los intereses: ${names.join(', ')}` : `Al quitar ${name}, deben revisarse los intereses asociados a esta área antes de confirmar.`}</p>;
      })} confirmLabel="Confirmar" confirming={saving} onCancel={() => { setSelectedIds(savedIds); setDialog(null); setError(''); setLimitError(''); }} onConfirm={() => void save()}>{error && <p role="alert">{error}</p>}</ConfirmModal>
    </main>
  );
}
