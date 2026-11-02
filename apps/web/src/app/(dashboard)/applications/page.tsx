'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/shared/components/button';
import { ApplicationDrawer } from '@/modules/applications/frontend/components/application-drawer';
import {
  fetchApplicationsBoard,
  fetchApplicationsMetrics,
  type BoardMetrics,
  type BoardPage,
} from '@/modules/applications/frontend/services/applications-board.service';
import {
  changeFilters,
  changePage,
  changePageSize,
  clampPage,
  parseApplicationsUrl,
  toApplicationsParams,
  type ApplicationsUrlState,
} from '@/modules/applications/frontend/services/application-query';
import { EMPTY_FILTERS, RequestsFilters, type BoardFilters } from './_components/requests-filters';
import { PeriodFiltersForm } from './_components/period-filters';
import { RequestsMetrics } from './_components/requests-metrics';
import { RequestsTable } from './_components/requests-table';

const CAREERS_URL = '/api/v1/registrations/careers';
const SEARCH_DELAY_MS = 400;

// Bandeja de solicitudes del backoffice (HU-04): lista, filtros, expediente y dictamen.
function ApplicationsBoardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const query = useMemo(
    () => parseApplicationsUrl(new URLSearchParams(queryString)),
    [queryString],
  );
  const queryRef = useRef<ApplicationsUrlState>(query);
  queryRef.current = query;

  const [searchInput, setSearchInput] = useState(query.search);
  const [board, setBoard] = useState<BoardPage | null>(null);
  const [metrics, setMetrics] = useState<BoardMetrics | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [careers, setCareers] = useState<{ id: string; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestId = useRef(0);

  const updateQuery = useCallback((next: ApplicationsUrlState) => {
    queryRef.current = next;
    const params = toApplicationsParams(next).toString();
    router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
  }, [pathname, router]);

  const loadMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    const result = await fetchApplicationsMetrics();
    if (result.ok) {
      setMetrics(result.data);
      setMetricsError(null);
    } else {
      setMetrics(null);
      setMetricsError(result.message);
    }
    setIsMetricsLoading(false);
  }, []);

  const loadBoard = useCallback(async (activeQuery: ApplicationsUrlState) => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setError(null);
    const result = await fetchApplicationsBoard({
      page: activeQuery.page,
      pageSize: activeQuery.pageSize,
      career: activeQuery.career || undefined,
      status: activeQuery.status || undefined,
      search: activeQuery.search || undefined,
      period: activeQuery.period || undefined,
      year: activeQuery.year,
      from: activeQuery.from || undefined,
      to: activeQuery.to || undefined,
    });
    if (currentRequestId !== requestId.current) return;

    if (result.ok) {
      const clampedQuery = clampPage(activeQuery, result.data.total);
      if (clampedQuery.page !== activeQuery.page) {
        updateQuery(clampedQuery);
        return;
      }
      setBoard(result.data);
      setNeedsLogin(false);
    } else {
      setNeedsLogin(result.needsLogin);
      setError(result.message);
    }
    setIsLoading(false);
  }, [updateQuery]);

  useEffect(() => {
    setSearchInput(query.search);
  }, [query.search]);

  useEffect(() => {
    if (query.search === searchInput.trim()) return;
    const timer = setTimeout(() => {
      updateQuery(changeFilters(queryRef.current, { search: searchInput }));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query.search, searchInput, updateQuery]);

  useEffect(() => {
    void loadBoard(query);
  }, [query, loadBoard]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    fetch(CAREERS_URL, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (Array.isArray(body?.data)) setCareers(body.data);
      })
      .catch(() => undefined);
  }, []);

  function handleFiltersChange(next: BoardFilters) {
    setSearchInput(next.search);
    const currentQuery = queryRef.current;
    if (next.career !== currentQuery.career || next.status !== currentQuery.status) {
      updateQuery(changeFilters(currentQuery, {
        search: next.search,
        career: next.career,
        status: next.status,
      }));
    }
  }

  if (needsLogin) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-oatmeal bg-white p-8 text-center">
          <p role="alert" className="text-sm font-medium text-abyssal-blue">
            {error ?? 'Inicia sesión como administrador para ver la bandeja.'}
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button type="button">Ir al inicio de sesión</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-3 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-abyssal-blue">
          Bandeja de Solicitudes{' '}
          <span className="ml-1 inline-block rounded-full bg-oatmeal/60 px-2 py-1 align-middle text-[10px] font-semibold text-abyssal-blue">
            {board ? `${board.total} en total` : '…'}
          </span>
        </h1>
        <p className="mt-0.5 text-xs text-abyssal-blue/70">
          Gestión y auditoría de expedientes de egresados de Ingeniería de Sistemas
        </p>
      </header>

      <section
        aria-label="Filtros de solicitudes"
        className="grid grid-cols-1 gap-2 rounded-xl border border-oatmeal bg-white p-2.5 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.65fr)_auto] lg:items-center sm:p-3"
      >
        <RequestsFilters
          filters={{ ...query, search: searchInput }}
          careers={careers}
          onChange={handleFiltersChange}
          onClear={() => {
            setSearchInput('');
            updateQuery(changeFilters(queryRef.current, {
              ...EMPTY_FILTERS,
              period: '',
              year: undefined,
              from: '',
              to: '',
            }));
          }}
        />
        <PeriodFiltersForm
          key={JSON.stringify([query.period, query.year, query.from, query.to])}
          filters={query}
          onApply={(periodFilters) =>
            updateQuery(
              changeFilters(queryRef.current, {
                ...periodFilters,
                search: searchInput.trim(),
              }),
            )
          }
        />
      </section>

      <RequestsMetrics metrics={metrics} isLoading={isMetricsLoading} />
      {metricsError && (
        <p role="alert" className="text-sm text-truffle-trouble">
          No se pudieron cargar los indicadores: {metricsError}
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-sm font-medium text-truffle-trouble">
          {error}
        </div>
      )}

      {isLoading && !board ? (
        <p className="rounded-2xl border border-oatmeal bg-white p-10 text-center text-sm text-abyssal-blue/70">
          Cargando solicitudes…
        </p>
      ) : (
        board && (
          <RequestsTable
            items={board.items}
            total={board.total}
            page={board.page}
            pageSize={board.pageSize}
            onPageChange={(page) => updateQuery(changePage(queryRef.current, page))}
            onPageSizeChange={(pageSize) =>
              updateQuery(changePageSize(queryRef.current, pageSize))
            }
            onSelect={setSelectedId}
          />
        )
      )}

      <ApplicationDrawer
        open={selectedId !== null}
        applicationId={selectedId}
        onClose={() => setSelectedId(null)}
        onReviewed={() => {
          setSelectedId(null);
          void loadBoard(queryRef.current);
          void loadMetrics();
        }}
      />
    </main>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsBoardView />
    </Suspense>
  );
}
