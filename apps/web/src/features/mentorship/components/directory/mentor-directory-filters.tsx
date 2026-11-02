'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontalIcon } from 'lucide-react';
import { emptyDirectoryFilters } from '../../model/mentor-directory';
import { sameConfiguration, type InterestArea, type InterestConfiguration } from '../../model/mentor-interests';

export function MentorDirectoryFilters({ catalog, applied, interestsSupported, disabled, onApply }: {
  catalog: InterestArea[];
  applied: InterestConfiguration;
  interestsSupported: boolean;
  disabled: boolean;
  onApply: (filters: InterestConfiguration) => void;
}) {
  const [draft, setDraft] = useState(applied);
  const [expandedInterests, setExpandedInterests] = useState(false);
  useEffect(() => { setDraft(applied); }, [applied]);

  const dirty = !sameConfiguration(draft, applied);

  const toggleArea = (id: string) => {
    setDraft(current => {
      const isRemoving = current.areaIds.includes(id);
      const areaIds = isRemoving ? current.areaIds.filter(value => value !== id) : [...current.areaIds, id];

      // CA-05: Los intereses asociados al área deseleccionada se desmarcan automáticamente
      const removingAreaTopics = new Set(
        isRemoving
          ? catalog.filter(area => area.id === id).flatMap(area => area.topics.map(t => t.id))
          : [],
      );

      // CA-03 & CA-05: Si hay áreas seleccionadas, únicamente se conservan los intereses pertenecientes a ellas
      const allowed = areaIds.length
        ? new Set(catalog.filter(area => areaIds.includes(area.id)).flatMap(area => area.topics.map(t => t.id)))
        : null;

      const topicIds = current.topicIds.filter(value => {
        if (removingAreaTopics.has(value)) return false;
        if (allowed && !allowed.has(value)) return false;
        return true;
      });

      return { areaIds, topicIds };
    });
  };

  const toggleTopic = (id: string) => setDraft(current => ({
    ...current,
    topicIds: current.topicIds.includes(id) ? current.topicIds.filter(value => value !== id) : [...current.topicIds, id],
  }));

  const clear = () => { const empty = emptyDirectoryFilters(); setDraft(empty); onApply(empty); };
  const groups = catalog.filter(area => !draft.areaIds.length || draft.areaIds.includes(area.id));
  const visibleGroups = expandedInterests || draft.areaIds.length ? groups : groups.slice(0, 3);

  return <aside className="directory-filters" aria-label="Filtros de mentores">
    <details open><summary><SlidersHorizontalIcon className="icon" aria-hidden="true" />Filtrar mentores</summary>
      <form onSubmit={event => { event.preventDefault(); if (dirty && !disabled) onApply(draft); }}>
        <fieldset disabled={disabled}><legend>Áreas técnicas <span>· selección múltiple</span></legend>
          {!catalog.length && <p className="directory-muted">{disabled ? 'Cargando áreas…' : 'Las áreas se mostrarán al cargar el directorio.'}</p>}
          {catalog.map(area => <label className={`directory-area-option ${draft.areaIds.includes(area.id) ? 'is-selected' : ''}`} key={area.id}>
            <input type="checkbox" checked={draft.areaIds.includes(area.id)} onChange={() => toggleArea(area.id)} />{area.name}
          </label>)}
        </fieldset>
        <fieldset disabled={disabled || !interestsSupported} className="directory-topic-fieldset"><legend>Intereses de mentoría <span>· selección múltiple</span></legend>
          {interestsSupported ? <>
            {/* CA-04: Mensaje contextual dinámico según haya o no áreas seleccionadas */}
            <p className="directory-muted">
              {draft.areaIds.length
                ? 'Intereses correspondientes a las áreas seleccionadas.'
                : 'Selecciona al menos un área técnica para ver sus intereses correspondientes.'}
            </p>
            {/* CA-03: Muestra únicamente los grupos de interés de las áreas seleccionadas */}
            <div id="directory-interest-groups">{visibleGroups.map(area => {
              const selectedCount = area.topics.filter(topic => draft.topicIds.includes(topic.id)).length;
              return <div className="directory-topic-group" key={area.id}>
                <h3>
                  <span>{area.name}</span>
                  {selectedCount > 0 && <span className="directory-topic-badge" aria-label={`${selectedCount} seleccionados`}>({selectedCount})</span>}
                </h3>
                <div className="directory-topic-options">{area.topics.map(topic => {
                  const selected = draft.topicIds.includes(topic.id);
                  return <button
                    key={topic.id}
                    type="button"
                    className={`directory-topic ${selected ? 'is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => toggleTopic(topic.id)}
                  >{topic.name}</button>;
                })}</div>
              </div>;
            })}</div>
            {!expandedInterests && !draft.areaIds.length && groups.length > 3 && <button type="button" className="mentor-button mentor-button-secondary directory-expand-interests" aria-controls="directory-interest-groups" onClick={() => setExpandedInterests(true)}>Cargar más intereses</button>}
          </> : <p className="directory-muted">Los intereses se mostrarán cuando estén disponibles.</p>}
        </fieldset>
        <div className="directory-filter-actions">
          <button className="mentor-button mentor-button-primary" type="submit" disabled={disabled || !dirty}>Aplicar filtros</button>
          <button className="mentor-button mentor-button-secondary" type="button" disabled={disabled || (!draft.areaIds.length && !draft.topicIds.length && !applied.areaIds.length && !applied.topicIds.length)} onClick={clear}>Limpiar filtros</button>
        </div>
      </form>
    </details>
  </aside>;
}
