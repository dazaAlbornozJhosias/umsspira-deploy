'use client';

import { Download } from 'lucide-react';

import type { ProfileHeader } from '@/modules/profile/data/profile-data';
import type { ProfileRecords } from '@/modules/profile/types/profile-record';
import { buildProfileJson, hasProfileBlocks } from '@/modules/profile/utils/build-profile-json';
import { buildProfileFileName } from '@/modules/profile/utils/profile-file-name';

type DownloadProfileButtonProps = {
  header: ProfileHeader;
  records: ProfileRecords;
};

/**
 * Descarga el perfil en JSON directamente en el navegador, sin recargar la página.
 * El endpoint GET /api/v1/perfil/exportar-json todavía no existe en el backend, por eso
 * el archivo se genera en el cliente a partir de los datos del perfil.
 */
function downloadProfile(header: ProfileHeader, records: ProfileRecords) {
  const now = new Date();
  const content = JSON.stringify(buildProfileJson(header, records, now), null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));

  const link = document.createElement('a');
  link.href = url;
  link.download = buildProfileFileName(header.name, now);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function DownloadProfileButton({ header, records }: DownloadProfileButtonProps) {
  // Sin bloques completados no hay nada que exportar
  const disabled = !hasProfileBlocks(records);

  return (
    <button
      type="button"
      onClick={() => downloadProfile(header, records)}
      disabled={disabled}
      title={disabled ? 'Completa al menos un bloque de tu perfil para descargarlo' : undefined}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-fantastic px-6 py-3.5 text-sm font-bold text-palladian transition hover:bg-abyssal-blue disabled:cursor-not-allowed disabled:bg-oatmeal disabled:text-blue-fantastic/50"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Descargar
    </button>
  );
}
