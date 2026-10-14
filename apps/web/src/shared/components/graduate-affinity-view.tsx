'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import AffinityRadar from '@/shared/components/affinity-radar';
import { RecalculateButton } from './recalculate-button';
import { AffinityTabs } from './affinity-tabs';
import { AffinityCustomizer } from './affinity-customizer';
import { PendingChangesDialog } from './pending-changes-dialog';
import { RadarErrorState } from './radar-error-state';
import { SuccessToast } from './success-toast';
import { AffinitySkeleton } from './affinity-skeleton';
import RadarInspection from './radar-inspection';
import affinityVectorMock from '../mocks/affinity-vector-mock.json';
import { useRecalculateState } from '../hooks/use-recalculate-state';
import { recalculateAffinity, getAffinityVector } from '../services/affinity-service';
import { AFFINITY_AREAS, type AffinityAreaScore } from '@umsspira/shared-types/src/affinity';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Ruta de Épica 2 almacenada en una constante a nivel de módulo
const RUTA_EPICA_2_CERTIFICACIONES = '/epica-2/certificaciones/nueva?returnTo=/afinidad';

// Áreas que espera el panel de inspección (se deriva de sus props para no duplicar el tipo)
type InspectionAreas = NonNullable<React.ComponentProps<typeof RadarInspection>['areas']>;

export const GraduateAffinityView: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileState, setProfileState] = useState<'calculated' | 'customizing'>('calculated');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasRadarError, setHasRadarError] = useState<boolean>(false);
  const [hasValidRadar, setHasValidRadar] = useState<boolean>(false);
  const [changeVersion, setChangeVersion] = useState<number>(0);
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState<boolean>(false);
  const [isSuccessToastOpen, setIsSuccessToastOpen] = useState<boolean>(false);
  
  const [changedAreaIds, setChangedAreaIds] = useState<string[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const [candidateAreas, setCandidateAreas] = useState<AffinityAreaScore[]>([
    { area: 'software-development', affinity: 95 },
    { area: 'cloud-devops', affinity: 64 },
    { area: 'data-ai', affinity: 71 },
    { area: 'quality-assurance', affinity: 58 },
    { area: 'cybersecurity-networks', affinity: 42 },
    { area: 'it-management', affinity: 50 },
  ]);

  const isRecalculatingRef = useRef<boolean>(false);
  const changeVersionRef = useRef<number>(0);

  const { hasPendingChanges, markPendingChanges, clearPendingChanges } = useRecalculateState();

  useEffect(() => {
    if (changeVersion === 0 || !hasPendingChanges) return;
    setIsPendingDialogOpen(true);
  }, [changeVersion, hasPendingChanges]);

  useEffect(() => {
    async function loadInitialVector() {
      try {
        setIsLoading(true);
        const result = await getAffinityVector();
        setCandidateAreas(
          result.areas.map((a) => ({
            area: a.area,
            affinity: a.affinity,
          }))
        );
        setHasValidRadar(true);
        setHasRadarError(false);
      } catch {
        setHasRadarError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialVector();
  }, []);

  const handleRecalculate = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    if (isRecalculatingRef.current) return;
    if (!force && !hasPendingChanges && !hasRadarError) return;

    isRecalculatingRef.current = true;
    setIsLoading(true);
    setIsPendingDialogOpen(false);
    const versionAtStart = changeVersionRef.current;

    try {
      const previousAreas = [...candidateAreas];
      const result = await recalculateAffinity();
      const newAreasMapped = result.areas.map((a) => ({
        area: a.area,
        affinity: a.affinity,
      }));

      const modifiedIds: string[] = [];
      result.areas.forEach((newAreaItem) => {
        const technicalKey = newAreaItem.area;
        const oldItem = previousAreas.find((p) => p.area === technicalKey);
        
        if (!oldItem || oldItem.affinity !== newAreaItem.affinity) {
          modifiedIds.push(technicalKey);
        }
      });

      setChangedAreaIds(modifiedIds);
      setCandidateAreas(newAreasMapped);

      if (changeVersionRef.current === versionAtStart) {
        clearPendingChanges();
      }
      setHasRadarError(false);
      setHasValidRadar(true);
      setIsSuccessToastOpen(true);
    } catch {
      setHasRadarError(true);
    } finally {
      isRecalculatingRef.current = false;
      setIsLoading(false);
    }
  }, [hasPendingChanges, hasRadarError, clearPendingChanges, candidateAreas]);

  const handleProfileChange = useCallback(() => {
    changeVersionRef.current += 1;
    setChangeVersion(changeVersionRef.current);
    markPendingChanges();
  }, [markPendingChanges]);

  const handleDismissPendingChanges = useCallback(() => {
    setIsPendingDialogOpen(false);
  }, []);

  const handleCloseToast = useCallback(() => {
    setIsSuccessToastOpen(false);
  }, []);

  const triggerTimeoutSimulation = useCallback(async () => {
    setIsLoading(true);
    setHasRadarError(false);
    await new Promise((resolve) => setTimeout(resolve, 7000));
    setHasRadarError(true);
    setIsLoading(false);
  }, []);

  const orderedCandidateAreas = AFFINITY_AREAS.map((areaKey) => {
    const found = candidateAreas.find((item) => item.area === areaKey);
    return found || { area: areaKey, affinity: 0 };
  });

  const radarData = hasRadarError && !hasValidRadar
    ? orderedCandidateAreas.map((item) => ({ ...item, affinity: Number.NaN }))
    : orderedCandidateAreas;

  // Mientras no llega el primer vector ni ocurre un error, se muestra el skeleton para no presentar el perfil como vacío (HU-2, escenarios de carga y error).
  const isInitialLoading = !hasValidRadar && !hasRadarError;

  // Los porcentajes del panel salen del mismo vector que dibuja el radar; los respaldos vienen del mock en el Sprint 1.
  const mockAreas = affinityVectorMock.areas as unknown as InspectionAreas;
  const inspectionAreas: InspectionAreas = orderedCandidateAreas.map((item) => ({
    area: item.area,
    affinity: item.affinity,
    evidence: mockAreas.find((mock) => mock.area === item.area)?.evidence ?? [],
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <a
            href="#"
            className="text-[13px] font-semibold text-truffle-trouble hover:underline flex items-center space-x-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a mi perfil</span>
          </a>
          <h1 className="text-[22px] sm:text-[32px] font-bold text-abyssal-blue tracking-tight">
            Tu afinidad profesional
          </h1>
          <p className="text-[13px] sm:text-sm text-blue-fantastic mt-1 max-w-xl">
            Visualiza las áreas profesionales que más se relacionan con tu perfil académico mediante snapshots locales.
          </p>
        </div>

        <AffinityTabs activeTab={profileState} onTabChange={setProfileState} />
      </div>

      {profileState === 'calculated' ? (
        isInitialLoading ? (
        <AffinitySkeleton />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-oatmeal flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-palladian pb-4 mb-4">
                <h3 className="font-bold text-abyssal-blue text-base">Gráfico de afinidad</h3>
                {/* La etiqueta solo aparece cuando existe un radar válido, no durante una falla inicial */}
                {hasValidRadar && (
                  <span className="text-xs font-mono font-semibold text-truffle-trouble bg-palladian px-2.5 py-1 rounded-md border border-oatmeal flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-truffle-trouble" />
                    <span>Vector Calculado</span>
                  </span>
                )}
              </div>

              <div className="relative py-4 flex flex-col items-center justify-center bg-palladian/40 rounded-xl border border-oatmeal/60">
                <div className={hasRadarError && hasValidRadar ? 'opacity-40' : undefined}>
                  {/* Se remueve variant="full" porque el componente usa la renderización estándar */}
                  <AffinityRadar
                    affinityData={radarData}
                    hasData={hasValidRadar}
                    isLoading={isLoading}
                    changedAreaIds={changedAreaIds}
                    selectedAreaId={selectedAreaId}
                    onSelectArea={setSelectedAreaId}
                  />
                </div>

                {hasRadarError && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <RadarErrorState onRetry={handleRecalculate} isRetrying={isLoading} />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-palladian mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[13px] text-blue-fantastic">
                Áreas profesionales, porcentaje de afinidad y palabras clave relacionadas con tu perfil.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  aria-label="Simular actualización del radar"
                  className="h-11 px-4 rounded-lg border border-oatmeal bg-white text-blue-fantastic text-sm font-semibold hover:bg-palladian transition-colors"
                >
                  Simular actualización del radar
                </button>

                <RecalculateButton
                  hasPendingChanges={hasPendingChanges}
                  isLoading={isLoading}
                  onRecalculate={handleRecalculate}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            {/* Con error y sin un radar válido previo no se muestra el panel, para no presentar la falla como un perfil sin datos */}
            {hasValidRadar && (
              <RadarInspection
                selectedAreaId={selectedAreaId}
                onSelectArea={setSelectedAreaId}
                areas={inspectionAreas}
              />
            )}
          </div>
          
          <button
            type="button"
            onClick={triggerTimeoutSimulation}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Simular Timeout (7s) [Demo Sprint 1]
          </button>
        </div>
        )
      ) : (
        <AffinityCustomizer />
      )}

      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={() => {
            router.push(RUTA_EPICA_2_CERTIFICACIONES);
          }}
          className="px-6 py-2.5 bg-burning-flame hover:bg-burning-flame/90 text-slate-900 font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
        >
          <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Añadir certificaciones</span>
        </button>
      </div>

      <PendingChangesDialog
        open={isPendingDialogOpen}
        onRecalculate={handleRecalculate}
        onDismiss={handleDismissPendingChanges}
      />
      <SuccessToast open={isSuccessToastOpen} onClose={handleCloseToast} />
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            role="dialog" 
            aria-modal="true"
            aria-label="Modal de simulación"
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 border border-slate-100"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Añadir nueva certificación</h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Simula el ingreso de una certificación oficial para actualizar los vectores de afinidad de forma simulada.
            </p>

            <div className="pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleRecalculate({ force: true });
                  setIsModalOpen(false);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Simular cambio en el perfil</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraduateAffinityView;