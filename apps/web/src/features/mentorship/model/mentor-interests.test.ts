import { normalizeInterests, sameConfiguration } from './mentor-interests';

it('elimina duplicados e intereses de áreas desconocidas o retiradas', () => {
  const catalog = [{ id: 'web', name: 'Web', description: '', topics: [{ id: 'react', name: 'React' }] },
    { id: 'datos', name: 'Datos', description: '', topics: [{ id: 'pg', name: 'PostgreSQL' }] }];
  expect(normalizeInterests(catalog, { areaIds: ['web', 'web', 'unknown'], topicIds: ['react', 'react', 'pg', 'unknown'] }))
    .toEqual({ areaIds: ['web'], topicIds: ['react'] });
});

it('compara selecciones sin depender del orden', () => {
  expect(sameConfiguration({ areaIds: ['a', 'b'], topicIds: ['1', '2'] }, { areaIds: ['b', 'a'], topicIds: ['2', '1'] })).toBe(true);
  expect(sameConfiguration({ areaIds: ['a'], topicIds: ['1'] }, { areaIds: ['a'], topicIds: [] })).toBe(false);
});
