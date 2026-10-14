import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Filtros de la bandeja (CA-04.2): carrera por nombre, estado y texto libre.
// age: '' = todas, within48 = menos de 48 h, over48 = vencidas (CA-04.1).
export class ListApplicationsQueryDto {
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(15)
  pageSize = 15;

  @Transform(trim)
  @IsOptional()
  @IsString()
  career?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  status?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['within48', 'over48'])
  age?: 'within48' | 'over48';
}
