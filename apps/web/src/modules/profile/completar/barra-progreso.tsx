type BarraProgresoProps = {
  completas: number;
  total: number;
};

// Barra segmentada (una parte por sección), igual que en la v3 del Figma
export function BarraProgreso({ completas, total }: BarraProgresoProps) {
  const porcentaje = Math.round((completas / total) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progreso del perfil"
      className="flex w-full gap-2"
    >
      {Array.from({ length: total }, (_, indice) => (
        <span
          key={indice}
          className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
            indice < completas ? 'bg-burning-flame' : 'bg-oatmeal'
          }`}
        />
      ))}
    </div>
  );
}
