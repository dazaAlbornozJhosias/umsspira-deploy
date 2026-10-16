import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class GetGraduatesQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  page?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['VERIFICADO', 'OBSERVADO'])
  status?: 'VERIFICADO' | 'OBSERVADO';
}
