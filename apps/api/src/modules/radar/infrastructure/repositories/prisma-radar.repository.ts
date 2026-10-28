import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { 
  RadarRepositoryPort,
  RadarCalculationSnapshot,
  AreaScoreRecord
} from '../../application/ports/radar-repository.port';

@Injectable()
export class PrismaRadarRepository implements RadarRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestCalculation(tituladoId: string): Promise<RadarCalculationSnapshot | null> {
    const calc = await this.prisma.calculoRadar.findFirst({
      where: { id_titulado: tituladoId },
      orderBy: { fecha_calculo: 'desc' }
    });

    if (!calc) {return null;}

    const afinidades = await this.prisma.afinidadRadar.findMany({
      where: { id_calculo_radar: calc.id }
    });

    return {
      id: calc.id,
      tituladoId: calc.id_titulado,
      hashEntrada: calc.hash_entrada,
      estado: calc.estado as 'COMPLETADO' | 'VACIO',
      versionAlgoritmo: calc.version_algoritmo,
      fechaCalculo: calc.fecha_calculo,
      afinidad: afinidades.map((a) => ({
        areaId: a.id_area,
        puntaje: Number(a.puntaje),
        porcentaje: Number(a.porcentaje),
        ponderacion: null, // Lo enviamos como null porque no existe en la BD
        palabrasClaveTop: a.palabras_clave_top as never
      }))
    };
  }

  async getPreviousCalculation(tituladoId: string, currentCalculationId: string): Promise<RadarCalculationSnapshot | null> {
    const calc = await this.prisma.calculoRadar.findFirst({
      where: { 
        id_titulado: tituladoId,
        id: { not: currentCalculationId } 
      },
      orderBy: { fecha_calculo: 'desc' }
    });

    if (!calc) {return null;}

    const afinidades = await this.prisma.afinidadRadar.findMany({
      where: { id_calculo_radar: calc.id }
    });

    return {
      id: calc.id,
      tituladoId: calc.id_titulado,
      hashEntrada: calc.hash_entrada,
      estado: calc.estado as 'COMPLETADO' | 'VACIO',
      versionAlgoritmo: calc.version_algoritmo,
      fechaCalculo: calc.fecha_calculo,
      afinidad: afinidades.map((a) => ({
        areaId: a.id_area,
        puntaje: Number(a.puntaje),
        porcentaje: Number(a.porcentaje),
        ponderacion: null, // Lo enviamos como null porque no existe en la BD
        palabrasClaveTop: a.palabras_clave_top as never
      }))
    };
  }

  async executeWithAdvisoryLock<T>(tituladoId: string, operation: () => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tituladoId}))`;
      return operation();
    });
  }

  async saveCalculation(params: {
    tituladoId: string;
    hashEntrada: string;
    estado: 'COMPLETADO' | 'VACIO';
    versionAlgoritmo: string;
    areas: AreaScoreRecord[];
    unmapped: Array<{ term: string; count: number }>;
  }): Promise<RadarCalculationSnapshot> {
    return await this.prisma.$transaction(async (transaction) => {
      const savedCalculation = await transaction.calculoRadar.create({
        data: {
          id_titulado: params.tituladoId,
          hash_entrada: params.hashEntrada,
          version_algoritmo: params.versionAlgoritmo,
          estado: params.estado,
          fecha_calculo: new Date(),
        },
      });

      if (params.areas.length > 0) {
        await transaction.afinidadRadar.createMany({
          data: params.areas.map((area) => ({
            id_calculo_radar: savedCalculation.id,
            id_area: area.areaId,
            puntaje: area.puntaje,
            porcentaje: area.porcentaje,
            palabras_clave_top: area.palabrasClaveTop as never,
          })),
        });
      }

      const currentUnmappedTerms = params.unmapped.map(({ term }) => term);
      await transaction.palabraClaveNoMapeada.deleteMany({
        where: {
          id_titulado: params.tituladoId,
          ...(currentUnmappedTerms.length > 0 ? { termino: { notIn: currentUnmappedTerms } } : {}),
        },
      });

      for (const keyword of params.unmapped) {
        await transaction.palabraClaveNoMapeada.upsert({
          where: {
            id_titulado_termino: {
              id_titulado: params.tituladoId,
              termino: keyword.term,
            },
          },
          create: {
            id_titulado: params.tituladoId,
            termino: keyword.term,
            frecuencia: keyword.count,
            fecha_deteccion: new Date(),
          },
          update: {
            frecuencia: keyword.count,
            fecha_deteccion: new Date(),
          },
        });
      }

      return {
        id: savedCalculation.id,
        tituladoId: savedCalculation.id_titulado,
        hashEntrada: savedCalculation.hash_entrada,
        estado: savedCalculation.estado as 'COMPLETADO' | 'VACIO',
        versionAlgoritmo: savedCalculation.version_algoritmo,
        fechaCalculo: savedCalculation.fecha_calculo,
        afinidad: params.areas,
      };
    });
  }

  async getAreaWeights(): Promise<Record<string, Array<{ term: string; peso: number }>>> {
    const weights = await this.prisma.palabraClaveArea.findMany();
    const result: Record<string, Array<{term: string, peso: number}>> = {};
    
    weights.forEach((w) => {
       if (!result[w.id_area]) {result[w.id_area] = [];}
       result[w.id_area].push({ term: w.id_palabra_clave, peso: Number(w.peso) });
    });
    
    return result;
  }
}