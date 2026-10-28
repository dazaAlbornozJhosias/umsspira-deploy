import { PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { ValidationError } from '../../errors/validation-error';

export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw ValidationError.fromZod(result.error);
    }
    return result.data;
  }
}
