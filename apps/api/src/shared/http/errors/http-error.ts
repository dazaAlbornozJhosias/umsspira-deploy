import { AppError } from '../../errors/app-error';

export class HttpError extends AppError {
  constructor(
    public readonly status: number,
    code: string,
    message: string,
  ) {
    super(code, message);
  }
}
