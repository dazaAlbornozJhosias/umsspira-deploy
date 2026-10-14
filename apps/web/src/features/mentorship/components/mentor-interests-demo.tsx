'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MentorInterests } from './mentor-interests';
import { PrimaryButton, SecondaryButton } from './mentor-button';
import { normalizeInterests, type InterestArea, type InterestConfiguration } from '../model/mentor-interests';

const catalog: InterestArea[] = [
  { id: 'backend', name: 'Backend', description: 'Servicios, APIs y lógica de servidor', topics: ['APIs REST', 'Spring Boot', 'Microservicios', 'Laravel', 'Golang', 'Node.js'].map((name, i) => ({ id: `backend-${i}`, name })) },
  { id: 'frontend', name: 'Frontend', description: 'Interfaces web y experiencia de usuario', topics: ['React', 'Accesibilidad web', 'Diseño de interfaces', 'Rendimiento web'].map((name, i) => ({ id: `frontend-${i}`, name })) },
  { id: 'datos', name: 'Bases de datos', description: 'Diseño, modelado y consultas', topics: ['PostgreSQL', 'Modelado de datos', 'Optimización de consultas'].map((name, i) => ({ id: `datos-${i}`, name })) },
];

export function MentorInterestsDemo() {
  const router = useRouter();
  const [configuration, setConfiguration] = useState<InterestConfiguration>({
    areaIds: ['backend', 'frontend', 'datos'], topicIds: ['backend-0', 'backend-1', 'frontend-0', 'frontend-1', 'datos-0', 'datos-1'],
  });
  const [editingAreas, setEditingAreas] = useState(false);
  const [areaDraft, setAreaDraft] = useState(configuration.areaIds);
  const [failSave, setFailSave] = useState(false);
  function navigate(href: string) {
    if (href === '/mentorship/profile/areas') { setAreaDraft(configuration.areaIds); setEditingAreas(true); }
    else router.push(href);
  }
  return <>
    {editingAreas ? <section className="interests-summary"><div><h2>Áreas técnicas · Simulación de la HU 6.2</h2>
      <p>Selecciona las áreas disponibles. Al confirmar, se eliminan los intereses de las áreas que retires.</p>
      {catalog.map(area => <label key={area.id} className="demo-area-option"><input type="checkbox" checked={areaDraft.includes(area.id)} onChange={event => setAreaDraft(event.target.checked ? [...areaDraft, area.id] : areaDraft.filter(id => id !== area.id))} /> {area.name}</label>)}
      <SecondaryButton onClick={() => setEditingAreas(false)}>Cancelar</SecondaryButton>{' '}
      <PrimaryButton onClick={() => { setConfiguration(normalizeInterests(catalog, { ...configuration, areaIds: areaDraft })); setEditingAreas(false); }}>Confirmar áreas de prueba</PrimaryButton>
    </div></section> : <MentorInterests catalog={catalog} initialConfiguration={configuration} profile={{ isActive: true, requirements: { egresado: true } }} onNavigate={navigate} onSave={async next => {
      if (failSave) throw new Error('No se pudieron guardar los intereses. Vuelve a intentar.');
      const confirmed = normalizeInterests(catalog, next);
      setConfiguration(confirmed);
      return confirmed;
    }} />}
    <aside className="interests-demo-notice"><strong>Vista de prueba · HU 6.3</strong><p>Datos de ejemplo. Los cambios duran mientras esta página permanezca abierta y no se guardan en la base de datos.</p>
      <label><input type="checkbox" checked={failSave} onChange={event => setFailSave(event.target.checked)} /> Simular error al guardar</label>
    </aside>
  </>;
}
