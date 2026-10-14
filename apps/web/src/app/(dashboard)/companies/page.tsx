'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  Company,
  CompanyContactResponse,
  CompanyHeaderResponse,
  UpdateCompanyPayload,
} from '@umsspira/shared-types';

import { CompanyDetails } from './company-details';
import { CompanyHeader } from './company-header';
import { EditCompanyForm } from '@/shared/components/edit-company-form';
import { ApiError, clearToken } from '@/shared/services/api-client';
import {
  getCompanyContact,
  getCompanyHeader,
  updateCompanyProfile,
} from '@/shared/services/companies';

/** Une header + contacto en el tipo que usa el formulario de edicion (null -> ''). */
function toCompany(h: CompanyHeaderResponse, c: CompanyContactResponse): Company {
  return {
    id: '',
    nombre: h.nombre,
    nit: c.taxId ?? '',
    descripcion: c.description ?? '',
    telefono: c.phone ?? '',
    correo: c.email ?? '',
    sitioWeb: c.website ?? '',
    direccion: c.address ?? '',
    tamano: c.companySize ?? '',
    eslogan: h.eslogan ?? '',
  };
}

export default function CompaniesPage() {
  const [header, setHeader] = useState<CompanyHeaderResponse | null>(null);
  const [contact, setContact] = useState<CompanyContactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [h, c] = await Promise.all([getCompanyHeader(), getCompanyContact()]);
      setHeader(h);
      setContact(c);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearToken();
        window.location.href = '/login';
        return;
      }
      setLoadError('No fue posible cargar los datos del perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(data: UpdateCompanyPayload): Promise<void> {
    // Mapea los nombres del formulario a los del backend. NIT nunca se envia.
    await updateCompanyProfile({
      razonSocial: data.nombre,
      descripcionLarga: data.descripcion,
      telefono: data.telefono,
      correo: data.correo,
      sitioWeb: data.sitioWeb,
      direccion: data.direccion,
      tamanoEmpresa: data.tamano,
      ...(data.eslogan ? { eslogan: data.eslogan } : {}),
    });
    // HU-03 CA11: volver a pedir al servidor para no conservar valores viejos
    await load();
    setIsEditing(false);
    setNotice('Perfil actualizado correctamente');
  }

  if (loading && !header) {
    return (
      <div className="min-h-screen bg-[#EEE9DF] p-8 text-sm text-[#2C3B40]" role="status">
        Cargando perfil…
      </div>
    );
  }

  if (loadError || !header || !contact) {
    return (
      <div className="min-h-screen bg-[#EEE9DF] p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C9C1B1] bg-white p-6">
          <p className="text-sm text-[#182632]">{loadError ?? 'No fue posible cargar los datos del perfil.'}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 px-5 py-2 bg-[#FFB162] text-[#182632] text-sm font-semibold rounded-lg hover:bg-[#FFA048]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-[#EEE9DF] p-6 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <EditCompanyForm
            company={toCompany(header, contact)}
            onCancel={() => setIsEditing(false)}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEE9DF] p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {notice && (
          <div role="status" className="rounded-lg border border-green-500 bg-green-50 p-3 text-sm font-semibold text-green-800">
            {notice}
          </div>
        )}
        <CompanyHeader
          companyName={header.nombre}
          companySlogan={header.eslogan}
          logoUrl={header.logoUrl}
          bannerImageUrl={header.bannerUrl}
        />
        <CompanyDetails
          description={contact.description}
          taxId={contact.taxId}
          companySize={contact.companySize}
          address={contact.address}
          email={contact.email}
          phone={contact.phone}
          website={contact.website}
          onEdit={() => {
            setNotice(null);
            setIsEditing(true);
          }}
        />
      </div>
    </div>
  );
}