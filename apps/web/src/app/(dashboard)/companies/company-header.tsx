'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface CompanyHeaderProps {
  companyName: string;
  companySlogan?: string | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
}

/** HU-02: sin datos por defecto de otra empresa (CA6/CA9); imagenes rotas degradan en forma controlada (CA7). */
export function CompanyHeader({
  companyName,
  companySlogan,
  logoUrl,
  bannerImageUrl,
}: CompanyHeaderProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  return (
    <div className="w-full mb-6">
      <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-[#182632] shadow-sm flex flex-col sm:flex-row border border-[#C9C1B1]">
        <div className="relative z-10 flex items-center h-full px-6 sm:px-8 py-6 w-full sm:w-1/2 gap-5">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#EEE9DF] shadow-md flex items-center justify-center shrink-0 overflow-hidden border border-[#C9C1B1]">
            {logoUrl && !logoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo de la empresa"
                className="h-full w-full object-cover"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <Building2 className="w-10 h-10 text-[#2C3B40]" />
            )}
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {companyName}
            </h1>
            {companySlogan ? (
              <p className="text-xs sm:text-sm text-[#EEE9DF] mt-1 font-normal leading-relaxed">
                {companySlogan}
              </p>
            ) : null}
          </div>
        </div>

        <div className="absolute sm:relative inset-0 sm:inset-auto sm:w-1/2 h-full z-0 opacity-40 sm:opacity-100">
          {bannerImageUrl && !bannerFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerImageUrl}
              alt="Imagen de fondo de la empresa"
              className="h-full w-full object-cover"
              onError={() => setBannerFailed(true)}
            />
          ) : (
            <div className="h-full w-full bg-[#2C3B40]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#182632] via-[#2C3B40]/50 to-transparent hidden sm:block" />
        </div>
      </div>
    </div>
  );
}