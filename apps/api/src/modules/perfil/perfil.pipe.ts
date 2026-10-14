import { ValidationPipe } from '@nestjs/common';

// Validación de los DTO del perfil. Se aplica por controlador (no global) para no alterar
// el comportamiento de los DTO de otros módulos como mentorship.
export const perfilValidationPipe = () =>
  new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true });
