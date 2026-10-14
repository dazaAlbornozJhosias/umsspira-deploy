import { BadRequestException, ValidationError } from '@nestjs/common';

export interface DocumentFieldError {
  field: string;
  message: string;
}

// Devuelve los errores de validacion con el mismo formato que el modulo de registro: { field, message }.
export function validationExceptionFactory(errors: ValidationError[]) {
  const fieldErrors: DocumentFieldError[] = errors.map((error) => {
    const constraints = error.constraints ?? {};
    return {
      field: error.property,
      message: constraints.isNotEmpty ?? Object.values(constraints)[0] ?? 'Valor no válido',
    };
  });

  return new BadRequestException({
    statusCode: 400,
    message: fieldErrors[0]?.message ?? 'Revisa los datos enviados',
    errors: fieldErrors,
  });
}
