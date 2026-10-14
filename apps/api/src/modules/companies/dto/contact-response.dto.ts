/**
 * DTO de respuesta para el endpoint GET /api/empresa/perfil/contacto.
 * Devuelve los datos de contacto y detalles institucionales de la empresa.
 * Alineado con las props de CompanyDetails del frontend (camelCase).
 */
export class ContactResponseDto {
  description: string | null;
  taxId: string | null;
  companySize: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}