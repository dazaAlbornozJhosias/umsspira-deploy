import { toAffinityAreaScores } from './affinity-areas';

describe('toAffinityAreaScores', () => {
  it('convierte las seis etiquetas en texto a los ids oficiales', () => {
    const resultado = toAffinityAreaScores([
      { area: 'desarrollo de software', affinity: 95 },
      { area: 'cloud & devops', affinity: 64 },
      { area: 'ciencia de datos & ia', affinity: 71 },
      { area: 'aseguramiento de calidad (QA)', affinity: 58 },
      { area: 'ciberseguridad y redes', affinity: 42 },
      { area: 'gestion de ti & gobernanza', affinity: 50 },
    ]);

    expect(resultado).toEqual([
      { area: 'software-development', affinity: 95 },
      { area: 'cloud-devops', affinity: 64 },
      { area: 'data-ai', affinity: 71 },
      { area: 'quality-assurance', affinity: 58 },
      { area: 'cybersecurity-networks', affinity: 42 },
      { area: 'it-management', affinity: 50 },
    ]);
  });

  it('deja pasar los ids que ya son oficiales', () => {
    expect(toAffinityAreaScores([{ area: 'data-ai', affinity: 80 }])).toEqual([
      { area: 'data-ai', affinity: 80 },
    ]);
  });

  it('descarta las etiquetas desconocidas', () => {
    expect(toAffinityAreaScores([{ area: 'otra cosa', affinity: 10 }])).toEqual([]);
  });

  it('ignora tildes y mayúsculas en las etiquetas', () => {
    expect(toAffinityAreaScores([{ area: 'Gestión de TI & Gobernanza', affinity: 30 }])).toEqual([
      { area: 'it-management', affinity: 30 },
    ]);
  });
});