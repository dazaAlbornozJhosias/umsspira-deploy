'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MentorState } from '@umsspira/shared-types';
import { CheckIcon, SaveIcon, Trash2Icon, Undo2Icon, LockKeyholeIcon, PlusIcon, XIcon, ServerIcon, MonitorIcon, DatabaseIcon, BadgeCheckIcon, ArrowRightIcon, ArrowLeftIcon } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/confirm-modal';
import { PrimaryButton, SecondaryButton } from './mentor-button';
import { normalizeInterests, sameConfiguration, type InterestArea, type InterestConfiguration } from '../model/mentor-interests';

interface Props {
  catalog: InterestArea[];
  initialConfiguration: InterestConfiguration;
  onSave: (configuration: InterestConfiguration) => Promise<InterestConfiguration>;
  areasHref?: string;
  onNavigate?: (href: string) => void;
  profile?: MentorState;
  minimumAreas?: number;
}

export function MentorInterests({ catalog, initialConfiguration, onSave, areasHref = '/mentorship/profile/areas', onNavigate, profile, minimumAreas = 0 }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => normalizeInterests(catalog, initialConfiguration));
  const [draft, setDraft] = useState(saved);
  const [dialog, setDialog] = useState<'save' | 'discard' | 'leave' | string | null>(null);
  const [destination, setDestination] = useState(areasHref);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const dirty = !sameConfiguration(saved, draft);
  const completedSteps = Number(saved.areaIds.length > 0) + Number(saved.topicIds.length > 0);
  const added = draft.topicIds.filter(id => !saved.topicIds.includes(id));
  const removed = saved.topicIds.filter(id => !draft.topicIds.includes(id));
  const topicName = (id: string) => catalog.flatMap(area => area.topics).find(topic => topic.id === id)?.name || id;
  const removingArea = catalog.find(area => dialog === `area:${area.id}`);
  const affectedTopics = removingArea?.topics.filter(topic => draft.topicIds.includes(topic.id)) || [];
  const navigate = (href: string) => onNavigate ? onNavigate(href) : router.push(href);

  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    function protectBreadcrumb(event: MouseEvent) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('.interests-page .breadcrumb-link') : null;
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      if (!savingRef.current) { setDestination(link.getAttribute('href') || '/mentorship/profile'); setDialog('leave'); }
    }
    document.addEventListener('click', protectBreadcrumb, true);
    return () => document.removeEventListener('click', protectBreadcrumb, true);
  }, [dirty]);

  function change(next: InterestConfiguration) {
    setDraft(normalizeInterests(catalog, next));
    setSuccess(false);
    setError('');
  }
  function leave(href: string) {
    if (savingRef.current) return;
    if (!dirty) navigate(href);
    else { setDestination(href); setDialog('leave'); }
  }
  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const confirmed = normalizeInterests(catalog, await onSave({ areaIds: [...draft.areaIds], topicIds: [...draft.topicIds] }));
      setSaved(confirmed);
      setDraft(confirmed);
      setSuccess(true);
      setDialog(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los intereses. Vuelve a intentar.');
    } finally { setSaving(false); savingRef.current = false; }
  }

  return <div className="interests-editor">
    <section className="interests-summary" aria-label="Áreas técnicas guardadas">
      <div className="interests-summary-status">{profile && <span className="interests-active-badge"><span />{profile.isActive ? 'Activo' : 'Inactivo'}</span>}<span>Intereses asociados a tus áreas técnicas</span><span className="interests-approved-badge">{profile?.requirements.egresado && <><BadgeCheckIcon size={16} aria-hidden="true" />Titulado aprobado · </>}{draft.areaIds.length} áreas seleccionadas</span></div>
      <div className="interests-summary-body"><p>Tus áreas técnicas guardadas determinan el catálogo disponible de intereses para orientación individual y de equipo.</p>
      <SecondaryButton disabled={saving} onClick={() => leave(areasHref)}>Modificar áreas técnicas<ArrowRightIcon size={16} aria-hidden="true" /></SecondaryButton></div>
    </section>
    <div className="interests-section-heading"><h2>Catálogo de tópicos por área</h2><p>Toca un tópico para agregarlo o quitarlo de tu perfil.</p></div>
    {!catalog.length && <p>No hay tópicos disponibles. Configura tus áreas técnicas para comenzar.</p>}
    <div className="interests-grid">{catalog.map(area => {
      const enabled = draft.areaIds.includes(area.id);
      const selected = area.topics.filter(topic => draft.topicIds.includes(topic.id));
      const name = area.name.toLocaleLowerCase('es');
      const AreaIcon = name.includes('backend') ? ServerIcon : name.includes('frontend') ? MonitorIcon : DatabaseIcon;
      return <section key={area.id} aria-labelledby={`area-${area.id}`} className={`interest-area${enabled ? '' : ' interest-area-locked'}`}>
        <div className="interest-area-header"><span className="interest-area-icon"><AreaIcon size={20} aria-hidden="true" /></span><div><div className="interest-area-heading"><h3 id={`area-${area.id}`}>{area.name}</h3><span>{enabled ? 'Área activa' : <><LockKeyholeIcon size={14} aria-hidden="true" /> Bloqueada</>}</span></div>
        <p>{area.description}</p></div></div>
        {enabled && area.topics.length === 0 && <p>Esta área todavía no tiene tópicos disponibles en el catálogo.</p>}
        {enabled ? <>
          <h4>En tu perfil · {selected.length} tópicos</h4>
          {selected.length === 0 && <p>Aún no seleccionaste intereses en esta área.</p>}
          <div className="interest-topics">{selected.map(topic => <button key={topic.id} type="button" aria-pressed="true" disabled={saving} onClick={() => change({ ...draft, topicIds: draft.topicIds.filter(id => id !== topic.id) })}>{topic.name}<XIcon size={14} aria-hidden="true" /></button>)}</div>
          <h4>Sugeridos</h4>
          <div className="interest-topics">{area.topics.filter(topic => !draft.topicIds.includes(topic.id)).map(topic => <button key={topic.id} type="button" aria-pressed="false" disabled={saving} onClick={() => change({ ...draft, topicIds: [...draft.topicIds, topic.id] })}><PlusIcon size={14} aria-hidden="true" />{topic.name}</button>)}</div>
          <div className="interest-area-footer"><span>{selected.length} de {area.topics.length} seleccionados</span><button type="button" disabled={saving || draft.areaIds.length <= minimumAreas} title={draft.areaIds.length <= minimumAreas ? 'Debes conservar al menos un área técnica.' : undefined} onClick={() => setDialog(`area:${area.id}`)}><Trash2Icon size={14} aria-hidden="true" />Quitar área</button></div>
        </> : <>
          <p>Área no incluida en tu selección técnica. Para seleccionar estos tópicos, primero debes agregar esta área en Áreas técnicas.</p>
          <div className="interest-topics">{area.topics.map(topic => <button key={topic.id} type="button" disabled>{topic.name}</button>)}</div>
          <SecondaryButton disabled={saving} onClick={() => leave(areasHref)}>Activar esta área técnica</SecondaryButton>
        </>}
      </section>;
    })}</div>
    <p className="interests-catalog-note">Solo se muestran tópicos de tus áreas técnicas. <button type="button" disabled={saving} onClick={() => leave(areasHref)}>Agregar otra área</button></p>
    <section className="interests-progress" aria-label="Configuración del perfil"><div className="interests-progress-heading"><h2>Completa tu perfil de mentor</h2><span><strong>{completedSteps}</strong> de 3 pasos completados</span></div><div className="interests-progress-track"><span style={{ width: `${(completedSteps / 3) * 100}%` }} /></div><ol><li><span className="interests-step-number"><CheckIcon size={16} aria-hidden="true" /></span><div><small>Paso 1</small><strong>Áreas técnicas</strong></div></li><li aria-current="step"><span className="interests-step-label">En edición</span><span className="interests-step-number">2</span><div><small>Paso actual</small><strong>Intereses de mentoría</strong></div></li><li><span className="interests-step-number">3</span><div><small>Paso 3</small><strong>Disponibilidad</strong></div></li></ol></section>
    {success && <div role="status" className="interests-success"><span><CheckIcon size={16} aria-hidden="true" /></span><div><strong>Intereses guardados correctamente</strong><p>Guardaste {saved.topicIds.length} intereses de mentoría.</p></div></div>}
    <footer className="interests-actions"><SecondaryButton disabled={saving} onClick={() => leave(areasHref)}><ArrowLeftIcon size={16} aria-hidden="true" />Volver a Áreas técnicas</SecondaryButton>
      <span role="status">{dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'}</span>
      <SecondaryButton disabled={!dirty || saving} onClick={() => setDialog('discard')}>Descartar cambios</SecondaryButton>
      <PrimaryButton disabled={!dirty} loading={saving} onClick={() => setDialog('save')}>Guardar configuración ({draft.topicIds.length})</PrimaryButton>
      {success && <SecondaryButton className="interests-return-profile" onClick={() => leave('/mentorship/profile')}><CheckIcon size={16} aria-hidden="true" />Volver a mi perfil</SecondaryButton>}
    </footer>
    <ConfirmModal open={dialog === 'save'} icon={SaveIcon} title="¿Guardar cambios en tus intereses?" description={`Tu perfil quedará con ${draft.topicIds.length} intereses de mentoría.`} cancelLabel="Seguir editando" confirmLabel="Guardar cambios" confirming={saving} onCancel={() => { setDialog(null); setError(''); }} onConfirm={() => void save()}>
      <p>Se agregarán ({added.length}): {added.map(topicName).join(', ') || 'Ninguno'}.</p><p>Se quitarán ({removed.length}): {removed.map(topicName).join(', ') || 'Ninguno'}.</p>
      {saved.areaIds.some(id => !draft.areaIds.includes(id)) && <p>También se actualizarán las áreas técnicas que quitaste.</p>}
      {error && <p role="alert">{error}</p>}
    </ConfirmModal>
    <ConfirmModal open={dialog === 'discard' || dialog === 'leave'} icon={Undo2Icon} title="¿Descartar los cambios?" description="Tu selección volverá a los últimos intereses guardados." cancelLabel="Seguir editando" confirmLabel="Descartar cambios" onCancel={() => setDialog(null)} onConfirm={() => { setDraft(saved); setDialog(null); setSuccess(false); if (dialog === 'leave') navigate(destination); }} />
    <ConfirmModal open={!!removingArea} icon={Trash2Icon} title="Esta área tiene tópicos asociados" description={`Si quitas ${removingArea?.name || ''}, también se quitarán sus tópicos de tu perfil al guardar.`} confirmLabel="Quitar de todos modos" onCancel={() => setDialog(null)} onConfirm={() => { if (removingArea) change({ ...draft, areaIds: draft.areaIds.filter(id => id !== removingArea.id) }); setDialog(null); }}>
      <h3>Tópicos que se quitarán</h3><p>{affectedTopics.map(topic => topic.name).join(', ') || 'No hay tópicos seleccionados en esta área.'}</p>
    </ConfirmModal>
  </div>;
}
