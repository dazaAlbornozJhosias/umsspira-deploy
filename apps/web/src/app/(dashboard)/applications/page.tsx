'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/button';
import { ApplicationDrawer } from '@/modules/applications/frontend/components/application-drawer';
import {
  fetchApplicationsBoard,
  type BoardPage,
} from '@/modules/applications/frontend/services/applications-board.service';
import { EMPTY_FILTERS, RequestsFilters, type BoardFilters } from './_components/requests-filters';
import { PAGE_SIZE, RequestsTable } from './_components/requests-table';

const CAREERS_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/registrations/careers`;

// Bandeja de solicitudes del backoffice (HU-04): lista, filtros, expediente y dictamen.
export default function ApplicationsPage() {
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [board, setBoard] = useState<BoardPage | null>(null);
  const [careers, setCareers] = useState<{ id: string; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadBoard = useCallback(async (activeFilters: BoardFilters, activePage: number) => {
    setIsLoading(true);
    setError(null);
    const result = await fetchApplicationsBoard({
      page: activePage,
      pageSize: PAGE_SIZE,
      career: activeFilters.career || undefined,
      status: activeFilters.status || undefined,
      search: activeFilters.search || undefined,
    });
    if (result.ok) {
      setBoard(result.data);
      setNeedsLogin(false);
    } else {
      setNeedsLogin(result.needsLogin);
      setError(result.message);
    }
    setIsLoading(false);
  }, []);

  // El buscador espera 400 ms después de dejar de escribir (CA-04.2: búsqueda en tiempo real).
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => {
        if (current.search === searchInput) return current;
        setPage(1);
        return { ...current, search: searchInput };
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadBoard(filters, page);
  }, [filters, page, loadBoard]);

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
    setFilters({ ...next, search: '' });
    setPage(1);
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
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-[28px] font-bold text-abyssal-blue sm:text-4xl">
          Bandeja de Solicitudes{' '}
          <span className="ml-2 inline-block rounded-full bg-oatmeal/60 px-3 py-1 align-middle text-xs font-semibold text-abyssal-blue">
            {board ? `${board.total} en total` : '…'}
          </span>
        </h1>
        <p className="mt-1 text-sm text-abyssal-blue/70">
          Gestión y auditoría de expedientes de titulados de Ingeniería de Sistemas e Ingeniería Informática 
        </p>
      </header>

      <RequestsFilters
        filters={{ ...filters, search: searchInput }}
        careers={careers}
        onChange={handleFiltersChange}
        onClear={() => {
          setSearchInput('');
          setFilters(EMPTY_FILTERS);
          setPage(1);
        }}
      />

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
            onPageChange={setPage}
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
          loadBoard(filters, page);
        }}
      />
    </main>
  );
}
