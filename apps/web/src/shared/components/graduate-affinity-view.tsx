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
import RadarInspection, { AREA_NAMES_MAP } from './radar-inspection';
import { formatPercentage } from '../utils/percentage';
import affinityVectorMock from '../mocks/affinity-vector-mock.json';
import { useRecalculateState } from '../hooks/use-recalculate-state';
import { recalculateAffinity, getAffinityVector } from '../services/affinity-service';
import { AFFINITY_AREAS, type AffinityAreaScore } from '@umsspira/shared-types/src/affinity';
import { ArrowLeft, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Formatea dinámicamente mes (3 letras) y año en español
const formatCalculatedDate = (dateString?: string | null): string | null => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;

  // Nombres canónicos de 3 letras para coincidir con el diseño (Ene, Feb, ..., Sep, Oct, Nov, Dic)
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();

  return `${mes} ${anio}`;
};

// Ruta de Épica 2 almacenada en una constante a nivel de módulo
const RUTA_EPICA_2_CERTIFICACIONES = '/epica-2/certificaciones/nueva?returnTo=/afinidad';

// Áreas que espera el panel de inspección
type InspectionAreas = NonNullable<React.ComponentProps<typeof RadarInspection>['areas']>;

type CandidateArea = AffinityAreaScore & {
  evidence?: any[];
  keywords?: string[];
};

const mockAreas = affinityVectorMock.areas as unknown as InspectionAreas;

// Obtiene evidencias priorizando las del vector recibido, o el mock como respaldo
const getAreaEvidence = (area: { area: string; evidence?: any[] }, fallbackMock: InspectionAreas): any[] => {
  if (area.evidence !== undefined) {
    return area.evidence;
  }
  return fallbackMock.find((mock) => mock.area === area.area)?.evidence ?? [];
};

// Procesa las áreas del vector: si no tiene evidencias, se le asigna afinidad 0
const processVectorAreas = (
  areas: Array<AffinityAreaScore & { evidence?: any[]; keywords?: string[] }>,
  fallbackMock: InspectionAreas
): CandidateArea[] => {
  return areas.map((a) => {
    const evidence = getAreaEvidence(a, fallbackMock);
    const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
    return {
      area: a.area,
      // Regla de negocio: áreas sin evidencias deben tener afinidad cero
      affinity: hasEvidence ? (a.affinity ?? 0) : 0,
      evidence,
      keywords: a.keywords ?? [],
    };
  });
};

// Solo extrae palabras clave de áreas que cuenten con evidencias
const extractKeywords = (areas: CandidateArea[]): string[] =>
  areas
    .filter((area) => (area.evidence?.length ?? 0) > 0)
    .flatMap((area) => area.keywords ?? []);

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
  const [lastCalculatedDate, setLastCalculatedDate] = useState<string | null>(null);

  const [candidateAreas, setCandidateAreas] = useState<CandidateArea[]>([
    { area: 'software-development', affinity: 95 },
    { area: 'cloud-devops', affinity: 64 },
    { area: 'data-ai', affinity: 71 },
    { area: 'quality-assurance', affinity: 58 },
    { area: 'cybersecurity-networks', affinity: 42 },
    { area: 'it-management', affinity: 50 },
  ]);
  const [loadedKeywords, setLoadedKeywords] = useState<string[]>([]);

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
        const processed = processVectorAreas(result.areas as any, mockAreas);
        setCandidateAreas(processed);
        setLoadedKeywords(extractKeywords(processed));
        setHasValidRadar(true);
        setLastCalculatedDate(formatCalculatedDate(result.calculatedAt));
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
      setLastCalculatedDate(formatCalculatedDate(result.calculatedAt));
      const processed = processVectorAreas(result.areas as any, mockAreas);

      const modifiedIds: string[] = [];
      processed.forEach((newAreaItem) => {
        const technicalKey = newAreaItem.area;
        const oldItem = previousAreas.find((p) => p.area === technicalKey);
        
        if (!oldItem || oldItem.affinity !== newAreaItem.affinity) {
          modifiedIds.push(technicalKey);
        }
      });

      setChangedAreaIds(modifiedIds);
      setCandidateAreas(processed);
      setLoadedKeywords(extractKeywords(processed));

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

  const isEmptyVector = candidateAreas.length === 0;
  const orderedCandidateAreas: CandidateArea[] = AFFINITY_AREAS.map((areaKey) => {
    const found = candidateAreas.find((item) => item.area === areaKey);
    return found || { area: areaKey, affinity: 0, evidence: [] };
  });

  const radarData = hasRadarError && !hasValidRadar
    ? orderedCandidateAreas.map((item) => ({ ...item, affinity: Number.NaN }))
    : orderedCandidateAreas;

  // Mientras no llega el primer vector ni ocurre un error, se muestra el skeleton
  const isInitialLoading = !hasValidRadar && !hasRadarError;

  // Respaldos inspeccionables preservando las evidencias recibidas en el vector
  const inspectionAreas: InspectionAreas = orderedCandidateAreas.map((item) => ({
    area: item.area,
    affinity: item.affinity,
    evidence: item.evidence ?? getAreaEvidence(item, mockAreas),
  }));

  // Top 3 áreas con evidencias y mayor afinidad
  const topAffinityAreas = [...orderedCandidateAreas]
    .filter((item) => {
      const ev = item.evidence ?? getAreaEvidence(item, mockAreas);
      return ev.length > 0 && item.affinity > 0;
    })
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 3)
    .map((item) => ({
      id: item.area,
      label: AREA_NAMES_MAP[item.area] ?? item.area,
      score: item.affinity,
    }));

  // Palabras clave consolidadas
  const influentialKeywords = Array.from(new Set(loadedKeywords));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/profile"
            className="text-[13px] font-semibold text-truffle-trouble hover:underline flex items-center space-x-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a mi perfil</span>
          </Link>
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
                  <h3 className="font-bold text-abyssal-blue text-xl">Gráfico de afinidad</h3>
                  {hasValidRadar && !isEmptyVector && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-oatmeal bg-white/90 text-xs text-slate-700 shadow-sm font-medium">
                      <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        Última actualización: <strong className="text-slate-900">{lastCalculatedDate ?? 'No disponible'}</strong>
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
                    </div>
                  )}
                </div>

                <div className="relative py-4 flex flex-col items-center justify-center bg-palladian/40 rounded-xl border border-oatmeal/60">
                  <div className={hasRadarError && hasValidRadar ? 'opacity-40' : undefined}>
                    <AffinityRadar
                      affinityData={radarData}
                      hasData={hasValidRadar && !isEmptyVector}
                      isLoading={isLoading}
                      changedAreaIds={changedAreaIds}
                      selectedAreaId={selectedAreaId}
                      onSelectArea={setSelectedAreaId}
                    />
                  </div>

                  {hasValidRadar && isEmptyVector && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-white/40 backdrop-blur-[3px] rounded-xl border border-white/50 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">
                        Completa tu perfil para<br />descubrir tu afinidad profesional
                      </h3>
                      <p className="text-xs text-slate-500 mb-5 max-w-[260px] mx-auto leading-relaxed">
                        Aún no podemos calcular tus áreas de mayor afinidad. Necesitamos algunos datos de tu perfil para generar tu mapa de afinidad.
                      </p>
                      <button 
                        type="button"
                        onClick={() => router.push('/profile')} 
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                      >
                        Completar perfil
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  )}

                  {hasRadarError && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <RadarErrorState onRetry={handleRecalculate} isRetrying={isLoading} />
                    </div>
                  )}
                </div>

                {hasValidRadar && !hasRadarError && !isLoading && (topAffinityAreas.length > 0 || influentialKeywords.length > 0) && (
                  <div className="mt-6 bg-palladian rounded-xl border border-oatmeal/60 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      <span className="text-sm font-bold text-gray-800">Áreas con mayor afinidad identificadas:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topAffinityAreas.map((area, index) => (
                        <div
                          key={area.id}
                          className={`px-3 py-1 text-sm rounded-md font-medium ${
                            index === 0
                              ? 'bg-[#FDBA74] text-gray-900'
                              : index === 1
                                ? 'bg-[#1E293B] text-white'
                                : 'bg-white border border-gray-300 text-gray-900'
                          }`}
                        >
                          {index + 1}. {area.label} ({formatPercentage(area.score)})
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-gray-700 shrink-0" />
                        <span className="text-sm font-bold text-gray-800">Palabras clave más influyentes:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {influentialKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full text-gray-600"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
                    className="h-11 px-4 rounded-lg border border-oatmeal bg-white text-blue-fantastic text-sm font-semibold hover:bg-palladian transition-colors flex items-center justify-center"
                  >
                    Simular Actualización
                  </button>

                  <RecalculateButton
                    hasPendingChanges={hasPendingChanges}
                    isLoading={isLoading}
                    onRecalculate={handleRecalculate}
                  />

                  <button
                    type="button"
                    onClick={triggerTimeoutSimulation}
                    className="min-h-[44px] px-3.5 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer select-none"
                  >
                    <span className="text-xs font-bold text-red-600 leading-tight">
                      Simular Timeout
                    </span>
                    <span className="text-[11px] font-medium text-red-500 leading-tight mt-0.5">
                      (7s) [Demo Sprint 1]
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              {hasValidRadar && (
                <RadarInspection
                  selectedAreaId={selectedAreaId}
                  onSelectArea={setSelectedAreaId}
                  areas={inspectionAreas}
                />
              )}
            </div>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
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