import type {
  ObservedApplicationDetail,
  ReplaceObservedDocumentResponse,
  SubmitCorrectionResponse,
  UpdateObservedDataResponse,
} from '../../domain/entities/observed-application';
import type {
  SubmitCorrectionUseCaseInput,
  UpdateObservedDataUseCaseInput,
  UploadedDocument,
} from '../contracts/registration-inputs';

export const OBSERVED_APPLICATION_PORT = Symbol('OBSERVED_APPLICATION_PORT');

export interface ObservedApplicationPort {
  getObservedApplication(applicationId: string): Promise<ObservedApplicationDetail>;
  updateObservedApplication(
    applicationId: string,
    input: UpdateObservedDataUseCaseInput,
  ): Promise<UpdateObservedDataResponse>;
  replaceDocument(
    applicationId: string,
    file: UploadedDocument,
    documentType?: string,
  ): Promise<ReplaceObservedDocumentResponse>;
  submitCorrection(
    applicationId: string,
    input: SubmitCorrectionUseCaseInput,
  ): Promise<SubmitCorrectionResponse>;
}
