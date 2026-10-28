import type { PrismaClient } from '../src/generated/prisma/client';
import { areas, seedAreas } from '../scripts/seed/catalogs';
import { AREA_IDS } from '../scripts/seed/demo-ids';

function database(existing = new Map<string, Record<string, unknown>>()) {
  const upsert = jest.fn(async ({ where, create, update }) => {
    const before = existing.get(where.id);
    const row = before ? { ...before, ...update } : { ...create };
    existing.set(where.id, row);
    return row;
  });
  const transaction = jest.fn(async (operation: (tx: unknown) => Promise<unknown>) => {
    const before = new Map(existing);
    try {
      return await operation({ area: { upsert } });
    } catch (error) {
      existing.clear();
      for (const [id, row] of before) {
        existing.set(id, row);
      }
      throw error;
    }
  });
  return {
    rows: existing,
    upsert,
    transaction,
    prisma: { $transaction: transaction } as unknown as PrismaClient,
  };
}

describe('Seed de áreas — N28 y N30', () => {
  it('crea diez áreas con los nombres y padres de la copia, sin actualizar existentes', async () => {
    const db = database();
    await seedAreas(db.prisma);
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.rows.size).toBe(10);
    for (const [call] of db.upsert.mock.calls) {
      expect(call.update).toEqual({});
      expect(call.create.esta_activo).toBe(true);
    }
    expect(db.rows.get(AREA_IDS.cloudDevops)).toMatchObject({
      nombre: 'Cloud/DevOps', padre_id: null,
    });
  });

  it('conserva incluso nombres, jerarquías y estados distintos y es idempotente', async () => {
    const original = areas.map((area) => [
      area.id,
      { id: area.id, nombre: 'Nombre conservado', padre_id: null, esta_activo: false },
    ] as const);
    const db = database(new Map(original));
    await seedAreas(db.prisma);
    await seedAreas(db.prisma);
    expect([...db.rows]).toEqual(original);
  });

  it('inserta los padres antes que sus hijas y no asigna padres a las seis áreas del Radar', async () => {
    const db = database();
    await seedAreas(db.prisma);
    const ids = db.upsert.mock.calls.map(([call]) => call.where.id);
    expect(ids.indexOf(AREA_IDS.technology)).toBeLessThan(ids.indexOf(AREA_IDS.data));
    expect(ids.indexOf(AREA_IDS.management)).toBeLessThan(ids.indexOf(AREA_IDS.projects));
    for (const id of [
      AREA_IDS.software, AREA_IDS.cloudDevops, AREA_IDS.dataAi,
      AREA_IDS.qualityAssurance, AREA_IDS.cybersecurityNetworks, AREA_IDS.itManagement,
    ]) {
      expect(db.rows.get(id)?.padre_id).toBeNull();
    }
  });

  it('revierte la etapa completa cuando falla un área', async () => {
    const db = database();
    const implementation = db.upsert.getMockImplementation()!;
    db.upsert.mockImplementationOnce(implementation).mockRejectedValueOnce(new Error('fallo simulado'));
    await expect(seedAreas(db.prisma)).rejects.toThrow('fallo simulado');
    expect(db.rows.size).toBe(0);
  });
});
