// Descripción profesional al inicio de la línea de tiempo del resumen (HU-07); vacía = "Sin registros"
export default function ProfessionalDescription({ description }: { description: string }) {
  return (
    <section aria-labelledby="professional-description-title" className="flex flex-col gap-3 pb-8">
      <h2
        id="professional-description-title"
        className="text-sm font-extrabold uppercase tracking-[0.2em] text-truffle-trouble"
      >
        Descripción profesional
      </h2>
      {description ? (
        <p className="whitespace-pre-line break-words text-sm leading-[1.6] text-blue-fantastic/80">
          {description}
        </p>
      ) : (
        <p className="text-sm font-medium text-blue-fantastic/60">Sin registros</p>
      )}
    </section>
  );
}
