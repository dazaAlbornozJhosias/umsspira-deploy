
'use client';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEE9DF] px-6 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-4 text-5xl" aria-hidden="true">
          📡
        </div>

        <h1 className="mb-3 text-2xl font-bold text-[#1B2632]">
          Sin conexión a Internet
        </h1>

        <p className="mb-6 text-[#2C384D]">
          El contenido solicitado no está disponible sin conexión.
          Comprueba tu conexión e inténtalo de nuevo.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#FFB162] px-6 py-3 font-semibold text-[#1B2632] hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}