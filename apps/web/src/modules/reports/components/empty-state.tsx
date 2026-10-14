interface EmptyStateProps {
  onRefresh?: () => void;
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        <span className="text-xl font-bold">0</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        No se encontraron titulados registrados
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        No hay expedientes activos o coincidentes en el sistema en este momento.
      </p>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 rounded-md bg-[#1B2632] px-4 py-2 text-sm font-medium text-white hover:bg-[#2C3B4D]"
        >
          Actualizar
        </button>
      )}
    </div>
  );
}