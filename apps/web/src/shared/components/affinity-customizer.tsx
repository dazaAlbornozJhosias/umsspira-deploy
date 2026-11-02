'use client';

import React, { useEffect, useState } from 'react';
import { Code, Database, Cloud, ShieldAlert, Lock, Target } from 'lucide-react';
import { AFFINITY_AREAS, AFFINITY_AREA_LABELS, type AffinityArea } from '@umsspira/shared-types/src/affinity';
import { getAffinityConfig, type AffinityAxisConfig } from '../services/affinity-service';

export const PROFILE_EDIT_ROUTE = '/ruta-epic2';
export const AFFINITY_ROUTE = '/afinidad';

const AREA_ICONS: Record<AffinityArea, React.ElementType> = {
  'software-development': Code,
  'cloud-devops': Cloud,
  'data-ai': Database,
  'quality-assurance': Target,
  'cybersecurity-networks': Lock,
  'it-management': ShieldAlert,
};

/**
 * Pestaña Personalizar en modo solo lectura: las ponderaciones las define el
 * sistema, por lo que se muestran como texto y se cargan al montar la pestaña.
 */
export const AffinityCustomizer: React.FC = () => {
  const [axes, setAxes] = useState<AffinityAxisConfig[]>([]);

  useEffect(() => {
    let isMounted = true;
    getAffinityConfig()
      .then((config) => {
        if (isMounted) setAxes(config.axes);
      })
      .catch(() => {
        // Sin configuración disponible la lista queda vacía; no hay control editable que validar
        if (isMounted) setAxes([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const weightByArea = new Map(axes.map((axis) => [axis.area, axis.weight]));

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-oatmeal space-y-6">
      <div className="border-b border-palladian pb-4">
        <h3 className="font-bold text-abyssal-blue text-base">Personalizar ejes y ponderaciones</h3>
        <p className="text-[13px] text-blue-fantastic mt-1">
          Las ponderaciones las define el sistema a partir de las palabras clave de tu perfil.
        </p>
      </div>

      <div className="space-y-4">
        {AFFINITY_AREAS.map((area) => {
          const Icon = AREA_ICONS[area];
          const weight = weightByArea.get(area);

          return (
            <div
              key={area}
              className="flex items-center justify-between p-4 rounded-xl bg-palladian/50 border border-oatmeal"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white border border-oatmeal text-blue-fantastic">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-abyssal-blue">{AFFINITY_AREA_LABELS[area]}</span>
              </div>

              <span
                data-testid={`ponderacion-${area}`}
                className="text-[13px] font-medium text-blue-fantastic"
              >
                Ponderación: {weight ?? '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
