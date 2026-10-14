export class GetGraduatesQueryDto {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'VERIFICADO' | 'OBSERVADO';
}