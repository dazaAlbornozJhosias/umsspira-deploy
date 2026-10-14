import { Injectable } from '@nestjs/common';
import {
  GraduateRecordMock,
  MOCK_GRADUATES,
} from '../../../mocks/reports-data.mock';
import { GraduateCsvRecord } from '../types/graduate-csv-record.type';
import {
  GraduateReportDataSource,
  GraduateReportFilters,
} from './graduate-report-data-source';

@Injectable()
export class MockGraduateReportDataSource implements GraduateReportDataSource {
  private readonly records: GraduateRecordMock[] = MOCK_GRADUATES;

  findAll(filters: GraduateReportFilters): GraduateCsvRecord[] {
    const filteredRecords = this.records.filter((record) => {
      if (filters.status && record.estado !== filters.status) {
        return false;
      }

      if (filters.career && record.idCarrera !== filters.career) {
        return false;
      }

      if (filters.search) {
        const search = this.normalize(filters.search);
        const fullName = this.normalize(
          `${record.apellido}, ${record.nombre}`,
        );

        if (
          !fullName.includes(search) &&
          !this.normalize(record.codSis).includes(search)
        ) {
          return false;
        }
      }

      return true;
    });

    return filteredRecords.map((record, index) => ({
      numero: index + 1,
      numeroRegistro: `#REG-${record.anioEgreso}-${record.id.slice(-4)}`,
      nombreCompleto: `${record.apellido}, ${record.nombre}`,
      codigoSis: record.codSis,
      telefono: record.telefono,
      correoElectronico: record.email,
      fechaIngreso: this.formatDate(record.fechaIngreso),
      fechaTitulacion: this.formatDate(record.fechaTitulacion),
      duracionEstudio: this.calculateDuration(
        record.fechaIngreso,
        record.fechaTitulacion,
      ),
      fechaRevision: this.formatDate(record.fechaCreacion),
      motivoRechazo: record.justificacion ?? '',
      estado: record.estado,
    }));
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return '';
    }

    const datePart = value.slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

    if (!match) {
      return value;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  private calculateDuration(
    startValue: string | null,
    endValue: string | null,
  ): string {
    const start = this.parseIsoDate(startValue);
    const end = this.parseIsoDate(endValue);

    if (!start || !end || end < start) {
      return '';
    }

    let totalMonths =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth());

    if (end.getUTCDate() < start.getUTCDate()) {
      totalMonths -= 1;
    }

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const yearText = `${years} ${years === 1 ? 'año' : 'años'}`;
    const monthText = `${months} ${months === 1 ? 'mes' : 'meses'}`;

    return `${yearText}, ${monthText}`;
  }

  private parseIsoDate(value: string | null): Date | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
