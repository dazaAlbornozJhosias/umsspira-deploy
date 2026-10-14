import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { GraduateReportStatus } from './data/graduate-report-data-source';
import { GraduateCsvRecord } from './types/graduate-csv-record.type';

export interface GeneratedCsvFile {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class GraduateCsvService {
  private readonly headers = [
    'Nro',
    'Número de registro',
    'Nombre completo',
    'Código SIS',
    'Teléfono',
    'Correo electrónico',
    'Fecha de ingreso',
    'Fecha de titulación',
    'Duración de estudio',
    'Fecha de revisión',
    'Motivo de rechazo',
    'Estado',
  ];

  generate(
    records: GraduateCsvRecord[],
    generationDate: Date = new Date(),
    status?: GraduateReportStatus,
  ): GeneratedCsvFile {
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException(this.buildEmptyMessage(status));
    }

    try {
      const rows = records.map((record) =>
        [
          record.numero,
          record.numeroRegistro,
          record.nombreCompleto,
          record.codigoSis,
          record.telefono,
          record.correoElectronico,
          record.fechaIngreso,
          record.fechaTitulacion,
          record.duracionEstudio,
          record.fechaRevision,
          record.motivoRechazo,
          record.estado,
        ]
          .map((value) => this.escapeValue(value))
          .join(','),
      );

      const headerRow = this.headers
        .map((header) => this.escapeValue(header))
        .join(',');

      const csvContent = `\uFEFF${[headerRow, ...rows].join('\r\n')}\r\n`;

      return {
        buffer: Buffer.from(csvContent, 'utf8'),
        filename: this.buildFilename(generationDate, status),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'No se pudo generar el archivo CSV. Intente nuevamente.',
      );
    }
  }

  private buildEmptyMessage(status?: GraduateReportStatus): string {
    if (status === 'VERIFICADO') {
      return 'No hay egresados verificados para exportar';
    }

    if (status === 'OBSERVADO') {
      return 'No hay egresados observados para exportar';
    }

    return 'No hay egresados para exportar';
  }

  private escapeValue(value: string | number): string {
    const text = String(value ?? '');
    const escapedText = text.replace(/"/g, '""');

    const requiresQuotes =
      escapedText.includes(',') ||
      escapedText.includes('"') ||
      escapedText.includes('\n') ||
      escapedText.includes('\r');

    return requiresQuotes ? `"${escapedText}"` : escapedText;
  }

  private buildFilename(
    date: Date,
    status?: GraduateReportStatus,
  ): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const suffix =
      status === 'VERIFICADO'
        ? '-verificados'
        : status === 'OBSERVADO'
          ? '-observados'
          : '';

    return `nomina-egresados${suffix}-${day}${month}${year}.csv`;
  }
}
