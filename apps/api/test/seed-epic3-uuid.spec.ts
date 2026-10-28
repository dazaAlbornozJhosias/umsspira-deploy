import type { PrismaClient } from '../src/generated/prisma/client';
import { seedEpic3, perfilesArea } from '../scripts/seed/epic-3';

describe('Seed Epic 3 - perfil profesional sin radar precalculado', () => {
  it('conserva el perfil profesional del titulado', async () => {
    const prisma = {
      perfilArea: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await seedEpic3(prisma as unknown as PrismaClient);

    expect(perfilesArea).toHaveLength(1);
    expect(perfilesArea[0].descripcion_profesional).toContain('TypeScript');
    expect(perfilesArea[0].descripcion_profesional).toContain('PostgreSQL');

    expect(prisma.perfilArea.createMany).toHaveBeenCalledWith({
      data: perfilesArea,
      skipDuplicates: true,
    });
  });

  it('no necesita operaciones de palabras clave ni cálculos de radar', async () => {
    const prisma = {
      perfilArea: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      palabraClave: { createMany: jest.fn(), upsert: jest.fn() },
      aliasPalabraClave: { createMany: jest.fn() },
      palabraClaveArea: { createMany: jest.fn() },
      palabraClaveNoMapeada: { createMany: jest.fn() },
      calculoRadar: { createMany: jest.fn() },
      afinidadRadar: { createMany: jest.fn() },
    };

    await seedEpic3(prisma as unknown as PrismaClient);

    expect(prisma.palabraClave.createMany).not.toHaveBeenCalled();
    expect(prisma.palabraClave.upsert).not.toHaveBeenCalled();
    expect(prisma.aliasPalabraClave.createMany).not.toHaveBeenCalled();
    expect(prisma.palabraClaveArea.createMany).not.toHaveBeenCalled();
    expect(prisma.palabraClaveNoMapeada.createMany).not.toHaveBeenCalled();
    expect(prisma.calculoRadar.createMany).not.toHaveBeenCalled();
    expect(prisma.afinidadRadar.createMany).not.toHaveBeenCalled();
  });
});
