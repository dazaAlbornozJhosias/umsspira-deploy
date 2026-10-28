import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CorrectionRequest } from '../guards/correction-token.guard';

export const CorrectionApplicationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<CorrectionRequest>();
    return request.applicationId ?? '';
  },
);
