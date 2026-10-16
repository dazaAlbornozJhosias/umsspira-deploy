'use client';

import React from 'react';
import { GraduateAffinityView } from '@/shared/components/graduate-affinity-view';

/**
 * Página de Afinidad Profesional - Modo Titulado / Egresado ("Mi Afinidad").
 * Muestra el radar chart y los hexágonos de afinidad del perfil (Épica 3 / Épica 2).
 */
export default function AffinityEgresadoPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <GraduateAffinityView />
    </main>
  );
}
