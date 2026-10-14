import { CrearExperienciaLaboralDto } from './dto/crear-experiencia-laboral.dto';
import { Registro } from './perfil.mappers';
import { PerfilRepository } from './perfil.repository';

// T1.7: guarda una experiencia laboral del titulado
export class ExperienciaLaboralService {
  constructor(private readonly repositorio: PerfilRepository) {}

  // Sin fecha de fin = trabajo actual: se guarda fecha_fin vacía (NULL)
  crear(tituladoId: string, datos: CrearExperienciaLaboralDto): Promise<Registro> {
    return this.repositorio.insertar('experiencia-laboral', tituladoId, {
      ...datos,
      fechaFin: datos.fechaFin || null,
    });
  }
}