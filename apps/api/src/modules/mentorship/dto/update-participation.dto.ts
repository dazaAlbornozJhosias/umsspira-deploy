import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateParticipationDto {
  @IsBoolean()
  esta_activo!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  experiencia?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  anios_exp?: number;
}
