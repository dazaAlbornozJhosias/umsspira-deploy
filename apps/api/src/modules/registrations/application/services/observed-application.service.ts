import { Inject, Injectable } from '@nestjs/common';
import type {
  ObservedApplicationDetail,
  UpdateObservedDataResponse,
} from '../../domain/entities/observed-application';
import {
  OBSERVED_APPLICATION_PORT,
  type ObservedApplicationPort,
} from '../ports/observed-application.port';
import type { UpdateObservedDataUseCaseInput } from '../contracts/registration-inputs';

@Injectable()
export class ObservedApplicationService {
  constructor(
    @Inject(OBSERVED_APPLICATION_PORT)
    private readonly repository: ObservedApplicationPort,
  ) {}

  async getObservedApplication(
    applicationId: string,
  ): Promise<ObservedApplicationDetail> {
    return this.repository.getObservedApplication(applicationId);
  }

  async updateObservedApplication(
    applicationId: string,
    input: UpdateObservedDataUseCaseInput,
  ): Promise<UpdateObservedDataResponse> {
    return this.repository.updateObservedApplication(applicationId, input);
  }
}
