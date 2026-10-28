import { assertDemoEnvironment } from '../scripts/seed/demo-environment';
import type { PrismaClient } from '../src/generated/prisma/client';
import { seedBase } from '../scripts/seed/base';
import { DEMO_ACCOUNTS } from '../scripts/seed/demo-accounts';

jest.mock('../scripts/seed/catalogs', () => ({ seedCatalogs: jest.fn() }));

describe('Destino del seed de demostración', () => {
  it.each(['production', undefined])('rechaza APP_ENV=%s', (APP_ENV) => {
    expect(() => assertDemoEnvironment({ APP_ENV })).toThrow('no se permite en producción');
  });

  it.each(['epic', 'dev', 'test'])('permite el destino explícito %s', (APP_ENV) => {
    expect(() => assertDemoEnvironment({ APP_ENV })).not.toThrow();
  });
});

describe('Cuentas de demostración', () => {
  function database(accounts = new Map<string, { usuario_id: string }>()) {
    const create = jest.fn(async ({ data }) => {
      accounts.set(data.correo, { usuario_id: data.usuario_id });
    });
    const client = {
      rolAcceso: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { codigo: 'titulado' },
            { codigo: 'administrador' },
            { codigo: 'empresa' },
          ]),
      },
      carrera: { createMany: jest.fn() },
      usuario: {
        findUnique: jest.fn(async ({ where }) => accounts.get(where.correo) ?? null),
        create,
      },
    };
    return { client: client as unknown as PrismaClient, create };
  }

  it('permite repetir la carga sin recrear cuentas ni reemplazar contraseñas', async () => {
    const { client, create } = database();
    const hash = jest.fn().mockResolvedValue('hash-de-prueba');

    await seedBase(client, { hash });
    await seedBase(client, { hash });

    expect(create).toHaveBeenCalledTimes(DEMO_ACCOUNTS.length);
    expect(hash).toHaveBeenCalledTimes(DEMO_ACCOUNTS.length);
    expect(create.mock.calls[0][0].data.titulado.create.id).toBe(DEMO_ACCOUNTS[0].profileId);
  });

  it('rechaza un correo que ya pertenece a otro UUID sin modificar esa cuenta', async () => {
    const { client, create } = database(
      new Map([[DEMO_ACCOUNTS[0].email, { usuario_id: '29000000-0000-4000-8000-000000000001' }]]),
    );
    const hash = jest.fn();

    await expect(seedBase(client, { hash })).rejects.toThrow('ya pertenece a otra cuenta');

    expect(create).not.toHaveBeenCalled();
    expect(hash).not.toHaveBeenCalled();
  });
});
