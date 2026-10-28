import type { Prisma } from '../../../../generated/prisma/client';
import type { Company } from '../../domain/entities/company.entity';
import type { CompanyHeader } from '../../application/contracts/company-header';
import type { CompanyContact } from '../../application/contracts/company-contact';
import type { UpdateCompanyProfileInput } from '../../application/contracts/update-company-profile.input';

export const companyHeaderSelect = {
  razon_social: true,
  eslogan: true,
  logo_url: true,
  banner_url: true,
} satisfies Prisma.EmpresaSelect;

export const companyProfileSelect = {
  id: true,
  razon_social: true,
  nit: true,
  eslogan: true,
  logo_url: true,
  banner_url: true,
  descripcion_larga: true,
  tamano_empresa: true,
  sitio_web: true,
  correo: true,
} satisfies Prisma.EmpresaSelect;

export const companyContactSelect = {
  descripcion_larga: true,
  nit: true,
  tamano_empresa: true,
  sitio_web: true,
  correo: true,
  telefono_empresa_registros: {
    select: { numero: true, tipo: true },
    orderBy: { id: 'asc' },
  },
  direccion_empresa_registros: {
    select: { direccion: true },
    orderBy: { id: 'asc' },
    take: 1,
  },
} satisfies Prisma.EmpresaSelect;

type HeaderRecord = Prisma.EmpresaGetPayload<{ select: typeof companyHeaderSelect }>;
type ProfileRecord = Prisma.EmpresaGetPayload<{ select: typeof companyProfileSelect }>;
type ContactRecord = Prisma.EmpresaGetPayload<{ select: typeof companyContactSelect }>;

export function toCompanyHeader(record: HeaderRecord): CompanyHeader {
  return {
    legalName: record.razon_social,
    slogan: record.eslogan,
    logoUrl: record.logo_url,
    bannerUrl: record.banner_url,
  };
}

export function toCompany(record: ProfileRecord): Company {
  return {
    id: record.id,
    legalName: record.razon_social,
    taxId: record.nit,
    slogan: record.eslogan,
    logoUrl: record.logo_url,
    bannerUrl: record.banner_url,
    description: record.descripcion_larga,
    companySize: record.tamano_empresa,
    website: record.sitio_web,
    email: record.correo,
  };
}

export function toCompanyContact(record: ContactRecord): CompanyContact {
  const phone =
    record.telefono_empresa_registros.find((item) => item.tipo === 'PRINCIPAL') ??
    record.telefono_empresa_registros[0];
  return {
    description: record.descripcion_larga,
    taxId: record.nit,
    companySize: record.tamano_empresa,
    website: record.sitio_web,
    email: record.correo,
    phone: phone?.numero ?? null,
    address: record.direccion_empresa_registros[0]?.direccion ?? null,
  };
}

export function toCompanyUpdate(
  input: UpdateCompanyProfileInput,
  now: Date,
): Prisma.EmpresaUpdateInput {
  return {
    razon_social: input.razonSocial,
    eslogan: input.eslogan,
    descripcion_larga: input.descripcionLarga,
    tamano_empresa: input.tamanoEmpresa,
    sitio_web: input.sitioWeb,
    correo: input.correo,
    fecha_actualizacion: now,
  };
}
