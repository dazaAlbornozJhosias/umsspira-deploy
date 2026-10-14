import { ConflictException, GoneException } from '@nestjs/common';
import { RegistrationsExceptionFilter } from './registrations-exception.filter';

function runFilter(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const filter = new RegistrationsExceptionFilter();
  filter.catch(exception as never, {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as never);
  return { json, status };
}

describe('RegistrationsExceptionFilter', () => {
  it('conserva el campo y los errores del conflicto de duplicado (CA-01.4)', () => {
    const body = {
      statusCode: 409,
      message: 'Este correo electrónico ya está registrado en otra solicitud',
      field: 'correo',
      errors: [{ field: 'correo', message: 'Este correo electrónico ya está registrado en otra solicitud' }],
    };

    const { json, status } = runFilter(new ConflictException(body));

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(body);
  });

  it('conserva el mensaje de sesion vencida (CA-01.6)', () => {
    const body = { statusCode: 410, message: 'El tiempo para completar tu registro venció.' };

    const { json, status } = runFilter(new GoneException(body));

    expect(status).toHaveBeenCalledWith(410);
    expect(json).toHaveBeenCalledWith(body);
  });
});
