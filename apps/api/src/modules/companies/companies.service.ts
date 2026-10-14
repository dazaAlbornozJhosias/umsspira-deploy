import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { HeaderResponseDto } from './dto/header-response.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { query } from '../../shared/lib/database';
import { ContactResponseDto } from './dto/contact-response.dto';

export interface EmpresaRow {
  id: string;
  razon_social: string | null;
  nit: string | null;
  eslogan: string | null;
  logo_url: string | null;
  banner_url: string | null;
  descripcion_larga: string | null;
  tamano_empresa: string | null;
  sitio_web: string | null;
  correo: string | null;
}

@Injectable()
export class CompaniesService {
  async getHeader(_empresaId: string): Promise<HeaderResponseDto> {
    const sql = `
      SELECT
        razon_social as "nombre",
        eslogan,
        logo_url as "logoUrl",
        banner_url as "bannerUrl"
      FROM empresa
      WHERE id = $1
      LIMIT 1
    `;
    const rows = await query<HeaderResponseDto>(sql, [_empresaId]);
    if (rows.length === 0) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return rows[0];
  }

  async updateProfile(
    _empresaId: string,
    dto: UpdateCompanyDto,
  ): Promise<EmpresaRow> {
    // TSK-4.7: Bloqueo explicito de NIT/RUC
    const dtoAny = dto as Record<string, unknown>;
    if ('nit' in dtoAny || 'NIT' in dtoAny || 'nitRuc' in dtoAny || 'NIT_RUC' in dtoAny) {
      throw new BadRequestException('El NIT/RUC no puede ser modificado');
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (dto.razonSocial !== undefined) {
      fields.push(`razon_social = $${paramIndex++}`);
      values.push(dto.razonSocial);
    }
    if (dto.eslogan !== undefined) {
      fields.push(`eslogan = $${paramIndex++}`);
      values.push(dto.eslogan);
    }
    if (dto.descripcionLarga !== undefined) {
      fields.push(`descripcion_larga = $${paramIndex++}`);
      values.push(dto.descripcionLarga);
    }
    if (dto.tamanoEmpresa !== undefined) {
      fields.push(`tamano_empresa = $${paramIndex++}`);
      values.push(dto.tamanoEmpresa);
    }
    if (dto.sitioWeb !== undefined) {
      fields.push(`sitio_web = $${paramIndex++}`);
      values.push(dto.sitioWeb);
    }
    if (dto.correo !== undefined) {
      fields.push(`correo = $${paramIndex++}`);
      values.push(dto.correo);
    }

    const hasExtra = dto.telefono !== undefined || dto.direccion !== undefined;
    if (fields.length === 0 && !hasExtra) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    fields.push(`fecha_actualizacion = NOW()`);
    values.push(_empresaId);

    const sql = `
      UPDATE empresa
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, razon_social, nit, eslogan, logo_url, banner_url,
                descripcion_larga, tamano_empresa, sitio_web, correo
    `;

    const rows = await query<EmpresaRow>(sql, values);

    if (rows.length === 0) {
      throw new NotFoundException('Empresa no encontrada');
    }

    // Telefono y direccion viven en tablas aparte: upsert atomico (una sola sentencia c/u)
    if (dto.telefono !== undefined) {
      await query(
        `WITH upd AS (
           UPDATE telefono_empresa SET numero = $2 WHERE id_empresa = $1 RETURNING 1
         )
         INSERT INTO telefono_empresa (id_empresa, numero, tipo)
         SELECT $1, $2, 'PRINCIPAL' WHERE NOT EXISTS (SELECT 1 FROM upd)`,
        [_empresaId, dto.telefono],
      );
    }
    if (dto.direccion !== undefined) {
      await query(
        `WITH upd AS (
           UPDATE direccion_empresa SET direccion = $2 WHERE id_empresa = $1 RETURNING 1
         )
         INSERT INTO direccion_empresa (id_empresa, direccion)
         SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM upd)`,
        [_empresaId, dto.direccion],
      );
    }

    return rows[0];
  }

  /**
   * TSK-3.4: Obtiene los datos de contacto y detalles institucionales.
   * Hace LEFT JOIN con direccion_empresa y telefono_empresa.
   * Devuelve null en campos que no existan (CA7).
   */
  async getContact(_empresaId: string): Promise<ContactResponseDto> {
    const sql = `
      SELECT
        e.descripcion_larga as "description",
        e.nit as "taxId",
        e.tamano_empresa as "companySize",
        e.correo as "email",
        e.sitio_web as "website",
        d.direccion as "address",
        t.numero as "phone"
      FROM empresa e
      LEFT JOIN direccion_empresa d ON d.id_empresa = e.id
      LEFT JOIN telefono_empresa t ON t.id_empresa = e.id
      WHERE e.id = $1
      LIMIT 1
    `;

    const rows = await query<ContactResponseDto>(sql, [_empresaId]);

    if (rows.length === 0) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return rows[0];
  }
}