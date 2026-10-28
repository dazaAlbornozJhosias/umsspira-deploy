import { applyDecorators, UseGuards } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { RegistrationTrafficGuard } from '../guards/registration-traffic.guard';

export function PublicRegistration() {
  return applyDecorators(Public(), UseGuards(TrustedOriginGuard, RegistrationTrafficGuard));
}
