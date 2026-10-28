import { runSeedStage, SeedStageError } from '../scripts/seed/seed-stage';
import { seedCatalogs } from '../scripts/seed/catalogs';
import type { PrismaClient } from '../src/generated/prisma/client';

describe('Etapas transaccionales del seed', () => {
  it('informa la etapa y no expone el error original ni continúa', async () => {
    const error = await runSeedStage('áreas', async () => {
      throw new Error('detalle privado del driver');
    }).catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(SeedStageError);
    expect((error as Error).message).toContain('áreas');
    expect(JSON.stringify(error)).not.toContain('privado');
  });

  it('detiene el catálogo si falla acceso y conserva su transacción propia', async () => {
    const createMany = jest.fn(() => Promise.resolve({ count: 0 }));
    const area = { upsert: jest.fn() };
    const transaction = jest.fn().mockRejectedValue(new Error('detalle privado'));
    const prisma = {
      $transaction: transaction,
      rolAcceso: { createMany },
      permisoAcceso: { createMany },
      rolPermiso: { createMany },
      carrera: { createMany: jest.fn() },
      area,
    } as unknown as PrismaClient;
    await expect(seedCatalogs(prisma)).rejects.toThrow('acceso');
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(prisma.carrera.createMany).not.toHaveBeenCalled();
    expect(area.upsert).not.toHaveBeenCalled();
  });
});
