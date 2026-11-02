// Panel de Comunidad para usuarios con sesión iniciada: solo el panel blanco.
export default function ComunidadPage() {
  return (
    <div className="bg-[#EEE9DF]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div
          aria-label="Panel de comunidad"
          className="min-h-[60vh] rounded-2xl border border-slate-200 bg-white shadow-sm"
        />
      </section>
    </div>
  );
}