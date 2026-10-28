import type { PrismaClient } from '../src/generated/prisma/client';
import { normalizePhrase } from '../src/modules/nlp/domain/policies/text-normalizer';
import { RADAR_DICTIONARY, seedRadarCatalog } from '../scripts/seed/radar-catalog';

describe('Radar catalog - idempotencia', () => {
  it('reutiliza keywords y alias y mantiene los pesos tras dos ejecuciones', async () => {
    const keywords = new Map<string, string>();
    const aliases = new Map<string, string>();
    const associations = new Map<string, number>();

    let nextId = 0;

    const tx = {
      palabraClave: {
        findMany: jest.fn(async () =>
          [...keywords].map(([termino_normalizado, id]) => ({
            id,
            termino_normalizado,
          })),
        ),
        upsert: jest.fn(async ({ where }: { where: { termino_normalizado: string } }) => {
          const term = where.termino_normalizado as string;
          if (!keywords.has(term)) {
            keywords.set(term, `keyword-${++nextId}`);
          }
          return { id: keywords.get(term)! };
        }),
      },
      aliasPalabraClave: {
        findMany: jest.fn(async () =>
          [...aliases].map(([alias_normalizado, id_palabra_clave]) => ({
            alias_normalizado,
            id_palabra_clave,
            palabra_clave: {
              termino_normalizado: [...keywords].find(([, id]) => id === id_palabra_clave)![0],
            },
          })),
        ),
        upsert: jest.fn(
          async ({
            where,
            create,
          }: {
            where: { alias_normalizado: string };
            create: { id_palabra_clave: string };
          }) => {
            const alias = where.alias_normalizado as string;
            if (!aliases.has(alias)) {
              aliases.set(alias, create.id_palabra_clave);
            }
            return { id: `alias-${alias}` };
          },
        ),
      },
      palabraClaveArea: {
        upsert: jest.fn(
          async ({
            where,
            create,
            update,
          }: {
            where: { id_palabra_clave_id_area: { id_palabra_clave: string; id_area: string } };
            create: { peso: number };
            update: { peso: number };
          }) => {
            const { id_palabra_clave, id_area } = where.id_palabra_clave_id_area;
            const key = `${id_palabra_clave}:${id_area}`;
            associations.set(key, associations.has(key) ? update.peso : create.peso);
            return { id: key };
          },
        ),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (client: unknown) => Promise<unknown>) =>
        callback(tx),
      ),
    } as unknown as PrismaClient;

    await seedRadarCatalog(prisma);

    const firstKeywords = new Map(keywords);
    const firstAliases = new Map(aliases);
    const firstAssociations = new Map(associations);

    await seedRadarCatalog(prisma);

    expect(keywords).toEqual(firstKeywords);
    expect(aliases).toEqual(firstAliases);
    expect(associations).toEqual(firstAssociations);

    expect(keywords.size).toBeGreaterThan(0);
    expect(aliases.size).toBeGreaterThanOrEqual(keywords.size);

    const expectedAssociationCount = Object.values(RADAR_DICTIONARY).reduce(
      (sum, definitions) => sum + definitions.length,
      0,
    );

    expect(associations.size).toBe(expectedAssociationCount);

    const pythonId = keywords.get(normalizePhrase('python'));
    expect(pythonId).toBeDefined();

    const pythonAssociations = [...associations.keys()].filter((key) =>
      key.startsWith(`${pythonId}:`),
    );

    expect(pythonAssociations).toHaveLength(2);
    expect(tx.palabraClave.upsert).toHaveBeenCalled();
    expect(tx.aliasPalabraClave.upsert).toHaveBeenCalled();
    expect(tx.palabraClaveArea.upsert).toHaveBeenCalled();
  });
});
describe('Radar catalog - conflictos de alias', () => {
  it('rechaza un alias asignado a otra keyword sin escribir registros', async () => {
    const tx = {
      palabraClave: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'keyword-java',
            termino_normalizado: 'java',
          },
        ]),
        upsert: jest.fn(),
      },
      aliasPalabraClave: {
        findMany: jest.fn().mockResolvedValue([
          {
            alias_normalizado: 'js',
            id_palabra_clave: 'keyword-java',
            palabra_clave: {
              termino_normalizado: 'java',
            },
          },
        ]),
        upsert: jest.fn(),
      },
      palabraClaveArea: {
        upsert: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (client: unknown) => Promise<unknown>) =>
        callback(tx),
      ),
    } as unknown as PrismaClient;

    await expect(seedRadarCatalog(prisma)).rejects.toThrow(/pertenece a otra palabra clave/);

    expect(tx.palabraClave.upsert).not.toHaveBeenCalled();
    expect(tx.aliasPalabraClave.upsert).not.toHaveBeenCalled();
    expect(tx.palabraClaveArea.upsert).not.toHaveBeenCalled();
  });
});
