import { IsArray, IsString } from 'class-validator';

/**
 * Áreas técnicas del mentor (1..5). El conteo y la existencia en el catálogo
 * los valida el servicio (responde 422 con código CANTIDAD_AREAS_INVALIDA y
 * AREA_NO_EXISTE); aquí solo se declara la propiedad, porque el ValidationPipe
 * global usa `whitelist: true` y BORRA las propiedades sin decoradores.
 */
export class UpdateMentorAreasDto {
  @IsArray({ message: 'areaIds debe ser una lista de identificadores' })
  @IsString({ each: true, message: 'Cada área debe indicarse con su identificador' })
  areaIds!: string[];
}
