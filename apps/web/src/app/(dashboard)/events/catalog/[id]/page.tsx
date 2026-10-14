import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiClient } from '@/shared/services/api-client'; // Tu ruta correcta

interface EventDetailPageProps {
  params: { id: string };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = params;
  let event: any = null;

  try {
    // Intentamos consumir la API real
    event = await apiClient(`/api/events/${id}`);
  } catch (error) {
    // Como Supabase tiene error de permisos, usamos un mock para que no te bloquees
    console.log("Error de backend detectado. Usando mock para probar la interfaz.");
    event = {
      id: id,
      title: "Evento de Prueba UMSSPIRA (Mock)",
      description: "Como la base de datos de Supabase tiene error de permisos, estamos mostrando estos datos de prueba para que puedas verificar tu Tarea 11.",
      startDate: "2026-10-15T09:00:00Z",
      endDate: "2026-10-15T18:00:00Z",
      location: "Auditorio de la Facultad de Tecnología",
      maxCapacity: 100,
      status: "publicado",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop"
    };
  }

  if (!event) {
    return notFound();
  }

  // Formateo de fechas
  const startDate = new Date(event.startDate).toLocaleString('es-BO');
  const endDate = new Date(event.endDate).toLocaleString('es-BO');
  const imageUrl = event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop";
  return (
    <div className="min-h-screen bg-[#F4EFE6] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navegación para regresar al catálogo */}
        <Link
          href="/events/catalog"
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-[#F89C4B] transition-colors"
        >
          ← Regresar al catálogo
        </Link>

        {/* Tarjeta de Detalle del Evento */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="w-full h-72 bg-slate-100 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h1 className="text-3xl font-bold text-[#1A202C]">{event.title}</h1>
              <span className="mt-3 md:mt-0 px-4 py-1.5 text-xs font-bold rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
                {event.status}
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Descripción</h3>
              <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                {event.description || 'Sin descripción disponible.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Fecha y Hora</h3>
                <p className="text-slate-900 font-medium">Inicio: <span className="font-normal">{startDate}</span></p>
                <p className="text-slate-900 font-medium">Fin: <span className="font-normal">{endDate}</span></p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Ubicación</h3>
                <p className="text-slate-900">{event.location || 'Por definir'}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Cupo Máximo</h3>
                <p className="text-slate-900">{event.maxCapacity} personas</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}