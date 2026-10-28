import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { DictionaryEntry } from '../../domain/entities/dictionary-entry';
import type { KeywordDictionaryPort } from '../../application/ports/keyword-dictionary.port';

@Injectable()
export class PrismaKeywordDictionaryRepository implements KeywordDictionaryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<DictionaryEntry[]> {
    const rows = await this.prisma.palabraClave.findMany({
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

    return rows.map((row) => ({
      canonical: row.termino_normalizado,
      aliases: row.alias_registros.map((alias) => alias.alias_normalizado),
      areas: row.area_registros.map((association) => ({
        id: association.area.id,
        nombre: association.area.nombre,
        peso: association.peso,
      })),
    }));
  }
}
