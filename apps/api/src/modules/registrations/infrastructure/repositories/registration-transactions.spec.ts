
/// <reference types="jest" />

import type { Prisma } from '../../../../generated/prisma/client';
import type { RegistrationData } from '../../domain/entities/registration';
import {
  assertNoDuplicate,
  assertRejectionLimit,
  MAX_REJECTIONS,
} from './registration-transactions';

const data: RegistrationData = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  ci: '1234567',
  complementoCi: '1A',
  expedidoEn: 'CB',
  correo: 'ana@example.com',
  telefono: '70000000',
  carreraId: 'career-id',
  anioEgreso: 2024,
  codigoSis: '123456789',
};

function mockTransaction(rejections: number) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([
      { total: rejections },
    ]),
    $executeRaw: jest.fn().mockResolvedValue(1),
    solicitud: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    usuario: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    titulado: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  return tx;
}

describe('T-11.1: límite de cinco rechazos', () => {
  it.each([0, 1, 2, 3, 4])(
    'permite registro nuevo con %i rechazos',
    async (count) => {
      const tx = mockTransaction(count);

      await expect(
        assertNoDuplicate(
          tx as unknown as Prisma.TransactionClient,
          data,
        ),
      ).resolves.toBeUndefined();
    },
  );

  it.each([5, 6])(
    'bloquea registro con %i rechazos',
    async (count) => {
      const tx = mockTransaction(count);

      await expect(
        assertNoDuplicate(
          tx as unknown as Prisma.TransactionClient,
          data,
        ),
      ).rejects.toMatchObject({
        code: 'REJECTION_LIMIT_REACHED',
      });

      expect(
        tx.solicitud.findFirst,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    'no depende del correo, teléfono ni SIS para contar el historial',
    async () => {
      const tx = mockTransaction(MAX_REJECTIONS);

      await expect(
        assertRejectionLimit(
          tx as unknown as Prisma.TransactionClient,
          {
            ...data,
            correo: 'otro@example.com',
            telefono: '71111111',
            codigoSis: '987654321',
          },
        ),
      ).rejects.toMatchObject({
        code: 'REJECTION_LIMIT_REACHED',
      });

      const sql = tx.$queryRaw.mock.calls[0][0] as TemplateStringsArray;

      expect(sql.join('')).not.toMatch(
        /email|telefono|cod_sis/i,
      );
    },
  );

  it(
    'exige CI, complemento y lugar de expedición en la consulta',
    async () => {
      const tx = mockTransaction(4);

      await assertRejectionLimit(
        tx as unknown as Prisma.TransactionClient,
        {
          ...data,
          expedidoEn: 'EX',
        },
      );

      const sql = tx.$queryRaw.mock.calls[0][0] as TemplateStringsArray;

      expect(sql.join('')).toContain(
        'd.expedido_en::text',
      );
      expect(sql.join('')).toContain(
        'd.extension_ci',
      );
      expect(sql.join('')).toContain('d.ci');

      expect(
        tx.$queryRaw.mock.calls[0].slice(1),
      ).toEqual([
        '1234567',
        '1A',
        'Extranjero',
      ]);
    },
  );
});
