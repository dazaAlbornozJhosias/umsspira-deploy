import type { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { PrismaKeywordDictionaryRepository } from './prisma-keyword-dictionary.repository';

describe('PrismaKeywordDictionaryRepository', () => {
  it('carga términos activos con alias, áreas y pesos', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        termino_normalizado: 'node.js',
        alias_registros: [{ alias_normalizado: 'nodejs' }, { alias_normalizado: 'node.js' }],
        area_registros: [
          {
            peso: 5,
            area: {
              id: 'area-1',
              nombre: 'Desarrollo de Software',
            },
          },
        ],
      },
      {
        termino_normalizado: 'javascript',
        alias_registros: [{ alias_normalizado: 'js' }],
        area_registros: [
          {
            peso: 4,
            area: {
              id: 'area-1',
              nombre: 'Desarrollo de Software',
            },
          },
          {
            peso: 2,
            area: {
              id: 'area-2',
              nombre: 'Inteligencia Artificial',
            },
          },
        ],
      },
    ]);

    const prisma = { palabraClave: { findMany } } as unknown as PrismaService;
    const repository = new PrismaKeywordDictionaryRepository(prisma);

    await expect(repository.load()).resolves.toEqual([
      {
        canonical: 'node.js',
        aliases: ['nodejs', 'node.js'],
        areas: [
          {
            id: 'area-1',
            nombre: 'Desarrollo de Software',
            peso: 5,
          },
        ],
      },
      {
        canonical: 'javascript',
        aliases: ['js'],
        areas: [
          {
            id: 'area-1',
            nombre: 'Desarrollo de Software',
            peso: 4,
          },
          {
            id: 'area-2',
            nombre: 'Inteligencia Artificial',
            peso: 2,
          },
        ],
      },
    ]);

    expect(findMany).toHaveBeenCalledWith({
      where: { esta_activo: true },
      select: {
        termino_normalizado: true,
        alias_registros: {
          select: { alias_normalizado: true },
          orderBy: { alias_normalizado: 'asc' },
        },
        area_registros: {
          select: {
            peso: true,
            area: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: { id_area: 'asc' },
        },
      },
      orderBy: { termino_normalizado: 'asc' },
    });
  });

  it('propaga el fallo de Prisma para que el loader responda 503', async () => {
    const findMany = jest.fn().mockRejectedValue(new Error('sin conexión'));
    const prisma = { palabraClave: { findMany } } as unknown as PrismaService;
    const repository = new PrismaKeywordDictionaryRepository(prisma);

    await expect(repository.load()).rejects.toThrow('sin conexión');
  });
});
