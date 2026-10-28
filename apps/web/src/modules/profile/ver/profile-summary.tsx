'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';

import DownloadProfileButton from '@/modules/profile/components/download-profile-button';
import { profileHeader } from '@/modules/profile/data/profile-data';
import AffinityLinkCard from '@/modules/profile/ver/affinity-link-card';
import ProfessionalDescription from '@/modules/profile/ver/professional-description';
import ProfileCompleteness from '@/modules/profile/ver/profile-completeness';
import { useProfileStore } from '@/modules/profile/state/profile-store';
import { profileCompleteness } from '@/modules/profile/utils/profile-completeness';
import { recordsToTimeline } from '@/modules/profile/utils/records-to-timeline';
import { sortSectionsByRecency } from '@/modules/profile/utils/sort-by-recency';
import Timeline from '@/shared/components/timeline';

// Resumen del perfil (HU-03) con la descarga en JSON (HU-05), leyendo el estado compartido del perfil
export default function ProfileSummary() {
  const { records, description, isLoading, loadError, retryLoad } = useProfileStore();
  const timeline = recordsToTimeline(records);

  const validatedBackups = timeline
    .flatMap((section) => section.items)
    .filter((item) => item.status === 'verified').length;
  const experiences = records.experience.length;
  const completeness = profileCompleteness(records, description);

  if (isLoading) {
  return <p role="status">Cargando tu perfil…</p>;
}

if (loadError) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p>No se pudo cargar tu perfil. {loadError}</p>
      <button
        type="button"
        onClick={retryLoad}
        className="rounded-lg bg-burning-flame px-4 py-2 font-bold text-abyssal-blue"
      >
        Reintentar
      </button>
    </div>
  );
}

  return (
    <div className="flex flex-col gap-8">
      {/* Cabecera del perfil */}
      <header className="flex flex-col gap-6 rounded-2xl border border-abyssal-blue/10 bg-white px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8 md:py-7">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.1em] text-truffle-trouble">
            {profileHeader.verified ? 'Perfil profesional verificado' : 'Perfil profesional'}
          </p>
          <h1 className="text-[28px] font-bold leading-tight text-blue-fantastic md:text-[40px]">
            {profileHeader.title} {profileHeader.name}
          </h1>
          <p className="text-base font-medium text-blue-fantastic/80 md:text-lg">
            {profileHeader.career} · Promoción {profileHeader.graduationYear}
          </p>
        </div>

        {/* Acciones del perfil */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* "Editar perfil" lleva a Gestionar registros (HU-04) */}
          <Link
            href="/profile/records"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-burning-flame px-6 py-3.5 text-sm font-bold text-abyssal-blue transition hover:brightness-95"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar perfil
          </Link>
          <DownloadProfileButton header={profileHeader} records={records} />
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Columna izquierda: resumen (solo escritorio) y acceso a la afinidad (Épica 3) */}
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[300px]">
          <aside className="flex w-full flex-col gap-4 rounded-2xl border border-abyssal-blue/10 bg-white p-6">
            <h2 className="text-xl font-bold text-blue-fantastic">Resumen del Perfil</h2>
            <p className="text-[13px] leading-[1.5] text-blue-fantastic/70">
              Este es el resumen digital de tu trayectoria académica y laboral registrada en la UMSS.
              Los respaldos documentales han sido validados por la administración de la Red de
              Egresados.
            </p>
            <ul className="flex flex-col gap-3 border-t border-oatmeal pt-4 text-xs font-semibold text-blue-fantastic">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0F5132]" aria-hidden="true" />
                {validatedBackups} Respaldos validados
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-truffle-trouble" aria-hidden="true" />
                {experiences} Experiencias registradas
              </li>
            </ul>
          </aside>
          <ProfileCompleteness completeness={completeness} />
          <AffinityLinkCard />
        </div>

        {/* Línea de tiempo, con la descripción profesional al inicio */}
        <section className="min-w-0 flex-1 rounded-2xl border border-abyssal-blue/10 bg-white px-4 py-5 md:px-7 md:py-6">
          <ProfessionalDescription description={description} />
          <Timeline sections={sortSectionsByRecency(timeline)} />
        </section>
      </div>
    </div>
  );
}
