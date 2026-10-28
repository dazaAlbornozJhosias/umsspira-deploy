/// <reference types="jest" />

import type { SubmitRegistrationInput } from '../../application/contracts/registration-inputs';
import { assertSameSubmission } from './registration-submission.policy';

describe('assertSameSubmission', () => {
  const input: SubmitRegistrationInput = {
    sessionToken: 'test-session',
    tipoDocumento: 'TITULO',
    rutaStorage: 'archivo-123',
    sizeBytes: 1024,
    mimeType: 'application/pdf',
    deseaMentor: false,
    fechaTitulacion: '2025-05-10',
    fechaIngreso: '2020-02-01',
  };

  const stored = {
    desea_mentor: false,
    fecha_titulacion: new Date('2025-05-10'),
    fecha_ingreso: new Date('2020-02-01'),
  };

  const file = {
    id: 'archivo-123',
    tipo_documento: 'TITULO',
    size_bytes: 1024,
    mime: 'application/pdf',
  };

  it('acepta un reintento con los mismos datos', () => {
    expect(() =>
      assertSameSubmission(input, stored, file),
    ).not.toThrow();
  });

  it('rechaza un documento diferente', () => {
    expect(() =>
      assertSameSubmission(
        { ...input, rutaStorage: 'otro-archivo' },
        stored,
        file,
      ),
    ).toThrow();
  });

  it('rechaza un tipo de documento diferente', () => {
    expect(() =>
      assertSameSubmission(
        { ...input, tipoDocumento: 'OTRO' },
        stored,
        file,
      ),
    ).toThrow();
  });

  it('rechaza un tamaño de archivo diferente', () => {
    expect(() =>
      assertSameSubmission(
        { ...input, sizeBytes: 2048 },
        stored,
        file,
      ),
    ).toThrow();
  });

  it('rechaza un cambio de mentoría', () => {
    expect(() =>
      assertSameSubmission(
        { ...input, deseaMentor: true },
        stored,
        file,
      ),
    ).toThrow();
  });

  it('rechaza una fecha de titulación diferente', () => {
    expect(() =>
      assertSameSubmission(
        { ...input, fechaTitulacion: '2025-05-11' },
        stored,
        file,
      ),
    ).toThrow();
  });

  it('rechaza una fecha de ingreso diferente', () => {
    expect(() =>
      assertSameSubmission(
        { ...input, fechaIngreso: '2020-02-02' },
        stored,
        file,
      ),
    ).toThrow();
  });

  it('rechaza si el archivo no existe', () => {
    expect(() =>
      assertSameSubmission(input, stored, null),
    ).toThrow();
  });

  it('acepta fechas opcionales ausentes', () => {
    expect(() =>
      assertSameSubmission(
        {
          ...input,
          fechaTitulacion: undefined,
          fechaIngreso: undefined,
        },
        {
          ...stored,
          fecha_titulacion: null,
          fecha_ingreso: null,
        },
        file,
      ),
    ).not.toThrow();
  });
});
