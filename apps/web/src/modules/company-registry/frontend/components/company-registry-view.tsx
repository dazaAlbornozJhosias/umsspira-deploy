'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, Plus, RefreshCw, Search } from 'lucide-react';
import type { CompanyRegistryPage } from '@umsspira/shared-types';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { listCompanyRegistry, resendCompanyInvitation } from '../services/company-registry.service';
import { formatDate, ROLE_LABELS } from './registry-format';
import { RegistryStatusBadge } from './registry-status-badge';

const PAGE_SIZE = 10;

type Notice = { kind: 'success' | 'error'; text: string } | null;

export function CompanyRegistryView() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CompanyRegistryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setData(await listCompanyRegistry({ search, page, pageSize: PAGE_SIZE }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No fue posible cargar las empresas.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResend = async (invitationId: string, email: string) => {
    setResendingId(invitationId);
    setNotice(null);
    try {
      await resendCompanyInvitation(invitationId);
      setNotice({
        kind: 'success',
        text: `Se envió una nueva invitación a ${email}. El enlace anterior ya no es válido.`,
      });
      await load();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'No fue posible reenviar la invitación.',
      });
    } finally {
      setResendingId(null);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-abyssal-blue">Registro de empresas</h1>
          <p className="text-sm text-abyssal-blue/70">
            Empresas habilitadas por la UMSS tras el acuerdo presencial y el estado de sus cuentas.
          </p>
        </div>
        <Link
          href="/company-registry/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-burning-flame px-5 text-sm font-semibold text-abyssal-blue transition hover:brightness-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Registrar empresa
        </Link>
      </header>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-xl border border-oatmeal bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            id="registry-search"
            label="Buscar por razón social o NIT"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Ej. TechSolutions o 1023456029"
          />
        </div>
        <Button type="submit" className="inline-flex items-center justify-center gap-2">
          <Search className="h-4 w-4" aria-hidden="true" />
          Buscar
        </Button>
      </form>

      {notice && (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-truffle-trouble'
          }`}
        >
          {notice.text}
        </p>
      )}

      {loading && (
        <p role="status" className="p-8 text-center text-sm text-abyssal-blue/70">
          Cargando empresas...
        </p>
      )}

      {!loading && loadError && (
        <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-truffle-trouble">{loadError}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !loadError && data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-oatmeal bg-white p-10 text-center">
          <Building2 className="h-8 w-8 text-oatmeal" aria-hidden="true" />
          <p className="text-sm text-abyssal-blue/70">
            {search ? 'Ninguna empresa coincide con la búsqueda.' : 'Todavía no se registraron empresas.'}
          </p>
        </div>
      )}

      {!loading && !loadError && data && data.items.length > 0 && (
        <section className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-oatmeal bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-oatmeal bg-palladian/60 text-xs uppercase tracking-wide text-abyssal-blue/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">NIT</th>
                  <th className="px-4 py-3 font-semibold">Cuentas iniciales</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Registrada</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((company) => (
                  <tr key={company.id} className="border-b border-palladian align-top last:border-0">
                    <td className="px-4 py-3 font-semibold text-abyssal-blue">{company.name || 'Sin nombre'}</td>
                    <td className="px-4 py-3 text-abyssal-blue">{company.taxId ?? '—'}</td>
                    <td className="px-4 py-3">
                      <ul className="space-y-2">
                        {company.invitations.map((invitation) => (
                          <li key={invitation.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-abyssal-blue">{invitation.email}</span>
                            <span className="text-xs text-abyssal-blue/60">{ROLE_LABELS[invitation.role]}</span>
                            <RegistryStatusBadge status={invitation.status} />
                            {(invitation.status === 'pendiente' || invitation.status === 'vencida') && (
                              <button
                                type="button"
                                onClick={() => void handleResend(invitation.id, invitation.email)}
                                disabled={resendingId !== null}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-fantastic hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                                {resendingId === invitation.id ? 'Reenviando...' : 'Reenviar'}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <RegistryStatusBadge status={company.status} />
                    </td>
                    <td className="px-4 py-3 text-abyssal-blue">{formatDate(company.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-abyssal-blue/70">
            <span>
              {data.total} {data.total === 1 ? 'empresa' : 'empresas'} · Página {data.page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}