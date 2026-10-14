'use client';

import { MapPin, Mail, Phone, Globe, Users, FileText, Pencil } from 'lucide-react';

interface CompanyDetailsProps {
  description?: string | null;
  taxId?: string | null;
  companySize?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  onEdit?: () => void;
}

const NA = <span className="italic text-[#8A929A]">No disponible</span>;

/** HU-03 CA7: dato sin registrar => "No disponible"; nunca datos de otra empresa. */
export function CompanyDetails({
  description,
  taxId,
  companySize,
  address,
  email,
  phone,
  website,
  onEdit,
}: CompanyDetailsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C9C1B1]">
          <h2 className="text-lg font-semibold text-[#182632] mb-3">Acerca de la empresa</h2>
          <p className="text-[#2C3B40] text-sm leading-relaxed whitespace-pre-line">
            {description || NA}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C9C1B1]">
          <h2 className="text-lg font-semibold text-[#182632] mb-4">Información general</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#EEE9DF] text-[#A35139] shrink-0 border border-[#C9C1B1]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[#2C3B40]/70 font-medium text-xs">NIT / RUC</span>
                <span className="text-[#182632] font-semibold">{taxId || NA}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#EEE9DF] text-[#A35139] shrink-0 border border-[#C9C1B1]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[#2C3B40]/70 font-medium text-xs">Tamaño de la empresa</span>
                <span className="text-[#182632] font-semibold">{companySize || NA}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C9C1B1]">
          <h2 className="text-lg font-semibold text-[#182632] mb-4">Contacto y ubicación</h2>
          <div className="space-y-4 text-sm text-[#2C3B40]">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#2C3B40]/50 shrink-0 mt-0.5" />
              <div>
                <span className="block font-medium text-[#182632]">Dirección</span>
                <span>{address || NA}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#2C3B40]/50 shrink-0 mt-0.5" />
              <div>
                <span className="block font-medium text-[#182632]">Correo electrónico</span>
                <span className="text-[#A35139] break-all">{email || NA}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#2C3B40]/50 shrink-0 mt-0.5" />
              <div>
                <span className="block font-medium text-[#182632]">Teléfono</span>
                <span>{phone || NA}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-[#2C3B40]/50 shrink-0 mt-0.5" />
              <div>
                <span className="block font-medium text-[#182632]">Sitio web</span>
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#A35139] hover:underline break-all"
                  >
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  NA
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2 px-5 py-2 bg-[#FFB162] text-[#182632] text-sm font-semibold tracking-[0.5px] rounded-lg hover:bg-[#FFA048] transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}