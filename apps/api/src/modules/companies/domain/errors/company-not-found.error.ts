import { ResourceNotFoundError } from '../../../../shared/errors/resource-not-found-error';

export class CompanyNotFoundError extends ResourceNotFoundError {
  constructor() {
    super('COMPANY_NOT_FOUND', 'No se encontró la empresa');
  }
}
