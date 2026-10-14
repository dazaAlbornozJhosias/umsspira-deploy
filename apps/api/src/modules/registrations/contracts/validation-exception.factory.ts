import { BadRequestException, ValidationError } from '@nestjs/common';

export interface RegistrationFieldError {
  field: string;
  message: string;
}

export function validationExceptionFactory(errors: ValidationError[]) {
  const fieldErrors: RegistrationFieldError[] = errors.map((e) => {
    const c = e.constraints ?? {};
    return {
      field: e.property,
      message: c.isNotEmpty ?? Object.values(c)[0] ?? 'Valor no válido',
    };
  });

  return new BadRequestException({
    statusCode: 400,
    message: 'Revisa los campos del formulario',
    errors: fieldErrors,
  });
}