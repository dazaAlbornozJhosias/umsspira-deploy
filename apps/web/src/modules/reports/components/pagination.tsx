'use client';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Truncamiento inteligente con puntos suspensivos (...) conforme al mockup de HU-1
  const getVisiblePages = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  return (
    <div className="flex flex-col gap-4 px-1 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Contador oficial de registros (HU-1 Criterio 4) */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span className="text-base" aria-hidden="true">☷</span>
        <span>
          Mostrando {startItem}-{endItem} de {totalItems} registros
        </span>
      </div>

      {/* Controles de paginación blindados contra deformación en móvil */}
      <nav aria-label="Paginación" className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap select-none">
        <button
          type="button"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="flex-shrink-0 h-9 px-3 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ANTERIOR
        </button>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {getVisiblePages().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 w-6 items-center justify-center text-xs font-bold text-slate-400 select-none flex-shrink-0"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-9 w-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[#1e293b] bg-[#1e293b] text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={goToNextPage}
          disabled={currentPage === totalPages || totalItems === 0}
          className="flex-shrink-0 h-9 px-3 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          SIGUIENTE
        </button>
      </nav>
    </div>
  );
}