'use client';

import { useEffect, useMemo, useState } from 'react';
import { KpiCard } from '../../../modules/reports/components/kpi-card';
import { GraduatesTable } from '../../../modules/reports/components/graduates-table';
import { EmptyState } from '../../../modules/reports/components/empty-state';
import { ConnectionErrorBanner } from '../../../modules/reports/components/connection-error-banner';
import { GraduatesSearch } from '../../../modules/reports/components/graduates-search';
import {
  GraduatesStatusFilter,
  type StatusFilterOption,
} from '../../../modules/reports/components/graduates-status-filter';
import { Pagination } from '../../../modules/reports/components/pagination';
import { ObservationModal } from '../../../modules/reports/components/observation-modal';
import { useDashboardIndicators } from '../../../modules/reports/hooks/use-dashboard-indicators';
import { useGraduates } from '../../../modules/reports/hooks/use-graduates';
import type { Graduate } from '../../../modules/reports/data/graduates.mock';
import { RotateCcw } from 'lucide-react';
import { searchAndRankGraduates } from '../../../modules/reports/utils/graduate-search';

// HU 4: Exportación institucional en PDF
import {
  GraduatesReportExport,
  type GraduateStatus,
} from '../../../modules/reports/graduates/pdf';

// HU 5: Exportación de nómina en CSV
import { GraduateCsvExport } from '../../../modules/reports/graduates/csv/graduate-csv-export';

const ITEMS_PER_PAGE = 10;
const REPORTS_LIST_STATE_KEY = 'umsspira:reports-liststate';
const REPORTS_ACTIVE_TAB_KEY = 'umsspira:reports-active-tab';

type ActiveTab = 'dashboard' | 'graduates';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const {
    data: indicators,
    loading: loadingIndicators,
    error: errorIndicators,
  } = useDashboardIndicators();
  const {
    data: graduates,
    loading: loadingGraduates,
    error: errorGraduates,
  } = useGraduates();

  // Estados de filtrado (HU 2)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilterOption>('TODOS');

  // Estados de paginación y modal (HU 3)
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGraduate, setSelectedGraduate] = useState<Graduate | null>(null);

  useEffect(() => {
    try {
      const savedTab = window.localStorage.getItem(REPORTS_ACTIVE_TAB_KEY) as ActiveTab;
      if (savedTab === 'dashboard' || savedTab === 'graduates') {
        setActiveTab(savedTab);
      }
      // HU-004 QA Bug 3: eliminar filtros heredados de versiones anteriores.
      // Los filtros permanecen solamente en estado React: al salir de /reports
      // se desmonta la página y al volver empiezan en sus valores por defecto.
      window.localStorage.removeItem(REPORTS_LIST_STATE_KEY);
    } catch {
      // La navegación continúa aunque localStorage esté bloqueado.
    }
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    try {
      window.localStorage.setItem(REPORTS_ACTIVE_TAB_KEY, tab);
    } catch {
      // noop
    }
  };

  const pdfExportStatus = useMemo<GraduateStatus>(() => {
    if (selectedStatus === 'OBSERVADO') return 'observed';
    return 'verified';
  }, [selectedStatus]);

  const filteredGraduates = useMemo(() => {
    // HU-004 QA Bugs 1, 2 y 4: normalizar espacios, comas y tildes;
    // priorizar coincidencias exactas y al inicio en la búsqueda.
    const byStatus = graduates.filter((graduate) =>
      selectedStatus === 'TODOS' || graduate.status === selectedStatus,
    );
    return searchAndRankGraduates(byStatus, searchTerm);
  }, [graduates, selectedStatus, searchTerm]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: StatusFilterOption) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('TODOS');
    setCurrentPage(1);
  };

  const paginatedGraduates = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGraduates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGraduates, currentPage]);

  useEffect(() => {
    if (loadingGraduates) return;
    const totalPages = Math.max(
      1,
      Math.ceil(filteredGraduates.length / ITEMS_PER_PAGE),
    );
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, filteredGraduates.length, loadingGraduates]);

  if (loadingIndicators || loadingGraduates) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando módulo de reportes...</p>
      </div>
    );
  }

  return (
    <main className="space-y-6 p-6">
      {/* Pestañas de navegación según mockup HU-1 */}
      <nav aria-label="Secciones de reporte" className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleTabChange('dashboard')}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'dashboard'
              ? 'border-[#1e293b] text-[#1e293b]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('graduates')}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'graduates'
              ? 'border-[#1e293b] text-[#1e293b]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Titulados
        </button>
      </nav>

      {/* Pestaña: Dashboard (KPIs e Indicadores) */}
      {activeTab === 'dashboard' && (
        <section aria-labelledby="dashboard-heading" className="space-y-6">
          <div>
            <h1 id="dashboard-heading" className="text-2xl font-bold text-gray-900">
              Dashboard de Indicadores
            </h1>
            <p className="text-sm text-gray-500">
              Métricas cuantitativas y resumen institucional del padrón
            </p>
          </div>

          {/* HU-004 CA-08: banner de conexión en lugar de un error genérico. */}
          {errorIndicators ? (
            <ConnectionErrorBanner />
          ) : (
            indicators && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Titulados registrados"
                  value={indicators.totalGraduates}
                />
                <KpiCard
                  title="Titulados verificados"
                  value={indicators.verifiedGraduates}
                />
                <KpiCard
                  title="Titulados observados"
                  value={indicators.observedGraduates}
                />
                <KpiCard
                  title="Mentores activos"
                  value={indicators.activeMentors}
                />
              </div>
            )
          )}
        </section>
      )}

      {/* HU-004 CA-08: si falla el padrón no se presenta como una lista vacía. */}
      {activeTab === 'graduates' && errorGraduates && (
        <section aria-label="Titulados">
          <ConnectionErrorBanner />
        </section>
      )}

      {/* Pestaña: Titulados (Filtros, Acciones y Tabla Base) */}
      {activeTab === 'graduates' && !errorGraduates && (
        <section aria-labelledby="graduates-heading" className="space-y-4">
          <div className="flex flex-col gap-4 rounded-lg border border-[#C9C1B1] bg-[#EEE9DF] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <GraduatesSearch
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onReset={handleResetFilters}
              />
              <GraduatesStatusFilter
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
              />

              <button
                type="button"
                onClick={handleResetFilters}
                title="Limpiar filtros"
                aria-label="Limpiar filtros"
                className="flex h-[50px] w-[50px] items-center justify-center rounded-md border border-[#C9C1B1] bg-white text-gray-600 transition-colors hover:bg-gray-100"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center self-end sm:self-auto">
              <GraduatesReportExport
                status={pdfExportStatus}
                onBackToListStart={() => setCurrentPage(1)}
                renderTrigger={({ exportPdf, isGenerating }) => (
                  <div className="w-48">
                    <GraduateCsvExport
                      totalRecords={filteredGraduates.length}
                      filters={{
                        status: selectedStatus,
                        search: searchTerm,
                      }}
                      isPdfGenerating={isGenerating}
                      onPdfExport={
                        selectedStatus === 'TODOS'
                          ? undefined
                          : () => exportPdf(pdfExportStatus)
                      }
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {filteredGraduates.length === 0 ? (
            <EmptyState onRefresh={handleResetFilters} />
          ) : (
            <div className="space-y-2">
              <GraduatesTable
                graduates={paginatedGraduates}
                onViewReason={setSelectedGraduate}
                startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
              />
              <Pagination
                currentPage={currentPage}
                totalItems={filteredGraduates.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </section>
      )}

      {/* Modal de Detalle de Observación (HU 3) */}
      {selectedGraduate && (
        <ObservationModal
          graduate={selectedGraduate}
          onClose={() => setSelectedGraduate(null)}
        />
      )}
    </main>
  );
}