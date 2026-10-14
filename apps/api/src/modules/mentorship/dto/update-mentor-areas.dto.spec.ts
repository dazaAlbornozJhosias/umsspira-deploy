import { ValidationPipe } from '@nestjs/common';
import { UpdateMentorAreasDto } from './update-mentor-areas.dto';

// Misma configuración que el ValidationPipe global de main.ts: con
// `whitelist: true`, las propiedades sin decoradores se BORRAN del dto.
const globalPipe = new ValidationPipe({ whitelist: true, transform: true });

describe('UpdateMentorAreasDto', () => {
  it('conserva areaIds al pasar por el ValidationPipe global (regresión del whitelist)', async () => {
    const dto = await globalPipe.transform(
      { areaIds: ['20000000-0000-4000-8000-000000000001'] },
      { type: 'body', metatype: UpdateMentorAreasDto },
    );

    expect(dto.areaIds).toEqual(['20000000-0000-4000-8000-000000000001']);
  });
});
