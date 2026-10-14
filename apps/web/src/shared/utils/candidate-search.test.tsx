import { rankCandidatesByQuery } from './candidate-search';

const makeCandidate = (id: string, software: number, cloud: number, skills: string[] = []) => ({
  id,
  skills,
  areas: [
    { area: 'desarrollo de software', affinity: software },
    { area: 'cloud & devops', affinity: cloud },
    { area: 'ciencia de datos & ia', affinity: 50 },
    { area: 'aseguramiento de calidad (QA)', affinity: 50 },
    { area: 'ciberseguridad y redes', affinity: 50 },
    { area: 'gestion de ti & gobernanza', affinity: 50 },
  ],
});

const ids = (list: { id: string }[]) => list.map((candidate) => candidate.id);

describe('rankCandidatesByQuery', () => {
  const a = makeCandidate('a', 90, 40);
  const b = makeCandidate('b', 30, 95);
  const c = makeCandidate('c', 60, 70, ['React', 'Docker']);

  it('ordena por el porcentaje del área Cloud cuando se busca docker', () => {
    expect(ids(rankCandidatesByQuery([a, b, c], 'docker'))).toEqual(['b', 'c', 'a']);
  });

  it('promedia varias áreas y desempata por las habilidades que coinciden', () => {
    expect(ids(rankCandidatesByQuery([a, b, c], 'react docker'))).toEqual(['c', 'a', 'b']);
  });

  it('ignora mayúsculas y tildes', () => {
    expect(ids(rankCandidatesByQuery([a, b, c], 'DESARROLLO'))).toEqual(['a', 'c', 'b']);
  });

  it('conserva el orden original si no reconoce ninguna palabra', () => {
    expect(ids(rankCandidatesByQuery([a, b, c], 'zzz qwerty'))).toEqual(['a', 'b', 'c']);
  });

  it('no elimina ni duplica candidatos', () => {
    expect(rankCandidatesByQuery([a, b, c], 'cloud')).toHaveLength(3);
  });

  it('trata como 0 el porcentaje ausente o no numérico', () => {
    const d = { id: 'd', skills: [], areas: [{ area: 'cloud & devops', affinity: null }] };

    expect(ids(rankCandidatesByQuery([d, a, b, c], 'cloud'))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('no modifica la lista recibida', () => {
    const original = [a, b, c];

    rankCandidatesByQuery(original, 'cloud');

    expect(ids(original)).toEqual(['a', 'b', 'c']);
  });
});