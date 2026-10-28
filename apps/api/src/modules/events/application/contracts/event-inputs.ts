export interface EventInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  location?: string;
  coverId?: string | null;
}

export interface CreateEventInput extends EventInput {
  status?: 'BORRADOR' | 'PUBLICADO';
}
