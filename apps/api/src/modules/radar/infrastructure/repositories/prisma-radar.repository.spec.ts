/// <reference types="jest" />
import { PrismaRadarRepository } from './prisma-radar.repository';
import type { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { calculateAffinity } from '../../domain/affinity-calculator';
import { RADAR_AREAS } from '../../domain/affinity-config';
import type { AffinityCalculation } from '../../domain/entities/affinity-calculation';
import { RADAR_AREA_IDS } from '../../domain/entities/radar-area';

describe('PrismaRadarRepository', () => {
  it('guarda el cálculo, los seis ejes y los términos no mapeados en una transacción', async () => {
    const transaction = {
      calculoRadar: { create: jest.fn().mockResolvedValue({ id: 'calculation-id' }) },
      afinidadRadar: { createMany: jest.fn().mockResolvedValue({ count: 6 }) },
      palabraClaveNoMapeada: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (tx: typeof transaction) => Promise<void>) =>
        callback(transaction),
      ),
    };
    const repository = new PrismaRadarRepository(prisma as unknown as PrismaService);
    const calculation: AffinityCalculation = {
      graduateId: 'graduate-id',
      inputHash: 'hash',
      calculatedAt: new Date('2026-10-22T12:00:00.000Z'),
      areas: calculateAffinity([], []),
      unmapped: [{ term: 'desconocido', count: 2 }],
    };

    await repository.saveCalculation({
      tituladoId: calculation.graduateId,
      hashEntrada: calculation.inputHash,
      estado: 'COMPLETADO',
      versionAlgoritmo: '1.0.0',
      areas: calculation.areas.map((a) => ({
        areaSlug: a.area as never,
        areaId: RADAR_AREA_IDS[a.area], // Corrección: Convertimos el texto al UUID usando el diccionario
        puntaje: a.score,
        porcentaje: a.percentage,
        ponderacion: a.weighting,
        palabrasClaveTop: a.topKeywords as never[],
      })),
      unmapped: calculation.unmapped,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.calculoRadar.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ hash_entrada: 'hash' }) }),
    );
    expect(transaction.afinidadRadar.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining(
        RADAR_AREAS.map((area) =>
          expect.objectContaining({
            id_calculo_radar: 'calculation-id',
            id_area: RADAR_AREA_IDS[area],
          }),
        ),
      ),
    });
    expect(transaction.afinidadRadar.createMany.mock.calls[0][0].data).toHaveLength(6);
    expect(transaction.palabraClaveNoMapeada.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.palabraClaveNoMapeada.deleteMany).toHaveBeenCalledWith({
      where: {
        id_titulado: 'graduate-id',
        termino: { notIn: ['desconocido'] },
      },
    });
  });

  it('elimina todos los no mapeados antiguos cuando el perfil ya no tiene ninguno', async () => {
    const transaction = {
      calculoRadar: { create: jest.fn().mockResolvedValue({ id: 'calculation-id' }) },
      afinidadRadar: { createMany: jest.fn().mockResolvedValue({ count: 6 }) },
      palabraClaveNoMapeada: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        upsert: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (tx: typeof transaction) => Promise<void>) =>
        callback(transaction),
      ),
    };
    const repository = new PrismaRadarRepository(prisma as unknown as PrismaService);

    await repository.saveCalculation({
      tituladoId: 'graduate-id',
      hashEntrada: 'new-profile-hash',
      estado: 'COMPLETADO',
      versionAlgoritmo: '1.0.0',
      areas: [],
      unmapped: [],
    });

    expect(transaction.palabraClaveNoMapeada.deleteMany).toHaveBeenCalledWith({
      where: { id_titulado: 'graduate-id' },
    });
    expect(transaction.palabraClaveNoMapeada.upsert).not.toHaveBeenCalled();
  });
});