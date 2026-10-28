import { NlpDictionaryUnavailableError } from '../src/modules/nlp/domain/errors/nlp-dictionary-unavailable-error';
import { MAX_EXTRACTION_TEXT_LENGTH } from '../src/modules/nlp/http/schemas/extract-keywords.schema';
import { DependencyUnavailableError } from '../src/shared/errors/dependency-unavailable-error';

const { NLP_MAX_TEXT_LENGTH } = jest.requireActual<{ NLP_MAX_TEXT_LENGTH: number }>(
  '../../../packages/shared-types/src/nlp',
);

describe('Compatibilidad del contrato de NLP', () => {
  it('conserva el contrato anterior del error de disponibilidad para auth', () => {
    const error = new DependencyUnavailableError();
    expect(error.code).toBe('RATE_LIMIT_UNAVAILABLE');
    expect(error.message).toBe('El control de acceso no está disponible temporalmente');
    const nlp = new NlpDictionaryUnavailableError();
    expect(nlp.code).toBe('NLP_DICTIONARY_UNAVAILABLE');
    expect(error.code).toBe('RATE_LIMIT_UNAVAILABLE');
  });

  it('mantiene alineado el límite público compartido con el schema del API', () => {
    expect(NLP_MAX_TEXT_LENGTH).toBe(MAX_EXTRACTION_TEXT_LENGTH);
    expect(NLP_MAX_TEXT_LENGTH).toBe(5000);
  });
});
