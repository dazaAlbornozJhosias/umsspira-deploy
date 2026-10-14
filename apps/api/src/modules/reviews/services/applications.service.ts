import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { ApplicationStatus } from '@umsspira/shared-types';
import { normalizeStatus, type ApplicationDetail, type ApplicationListItem } from '../contracts/application.contract';
import type { ListApplicationsQueryDto } from '../contracts/dto/list-applications-query.dto';
import { ApplicationsRepository, OVERDUE_HOURS } from '../repositories/applications.repository';

export const APPLICATIONS_SOURCE_UNAVAILABLE = 'No se pudieron cargar las solicitudes, intenta nuevamente';

const PAGE_SIZE_MAX = 15;

export interface ApplicationsPage {
  items: ApplicationListItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(private readonly applicationsRepository: ApplicationsRepository) {}

  // Bandeja paginada con filtros (CA-04.1 y CA-04.2).
  async listApplications(query: ListApplicationsQueryDto): Promise<ApplicationsPage> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? PAGE_SIZE_MAX, PAGE_SIZE_MAX);
    const status = query.status ? normalizeStatus(query.status) : undefined;

    const items = await this.withDataSource(() =>
      this.applicationsRepository.listApplications({
        career: query.career,
        status: status as ApplicationStatus | undefined,
        search: query.search,
        age: query.age,
      }),
    );

    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  }

  // Expediente completo para el drawer (CA-04.3).
  async getApplication(id: string): Promise<ApplicationDetail> {
    const detail = await this.withDataSource(() => this.applicationsRepository.findApplicationById(id));
    if (!detail) {
      throw new NotFoundException('La solicitud no existe.');
    }
    return detail;
  }

  // Acceso temporal al documento adjunto (URL firmada de 5 minutos, CA-04.3).
  async getDocumentUrl(path: string): Promise<{ url: string; expiresIn: number }> {
    return this.withDataSource(() => this.applicationsRepository.createDocumentSignedUrl(path));
  }

  private async withDataSource<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      this.logger.error(`Fallo al consultar las solicitudes: ${(error as Error).message}`);
      throw new ServiceUnavailableException(APPLICATIONS_SOURCE_UNAVAILABLE);
    }
  }
}

export { OVERDUE_HOURS };
