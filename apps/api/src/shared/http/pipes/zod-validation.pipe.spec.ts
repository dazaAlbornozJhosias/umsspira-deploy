import { z } from 'zod';
import { ValidationError } from '../../errors/validation-error';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('Validación HTTP con Zod', () => {
  it('entrega al caso de uso los datos transformados', () => {
    const pipe = new ZodValidationPipe(z.object({ cantidad: z.coerce.number().int().positive() }));
    expect(pipe.transform({ cantidad: '3' })).toEqual({ cantidad: 3 });
  });

  it('identifica campos anidados sin incluir sus valores', () => {
    const pipe = new ZodValidationPipe(
      z.object({
        contacto: z.object({ correo: z.email({ error: 'Correo no válido' }) }),
      }),
    );
    try {
      pipe.transform({ contacto: { correo: 'dato-privado' } });
      throw new Error('Se esperaba un error de validación');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields).toEqual({
        'contacto.correo': ['Correo no válido'],
      });
      expect(JSON.stringify(error)).not.toContain('dato-privado');
    }
  });
});
