import React from 'react';
import { Navbar } from '@/shared/components/navbar';
import Image from 'next/image';
import { Search, Calendar, Briefcase, Star, Users, ChevronRight, Bookmark } from 'lucide-react';

// Importamos tu imagen de fondo principal
import umssBg from '@/shared/assets/images/14sept.webp';

// 📂 Importa aquí las imágenes para las 3 tarjetas de eventos (ajusta las rutas según tus archivos reales)
import eventImg1 from '@/shared/assets/images/reencuentro.jpg';
import eventImg2 from '@/shared/assets/images/networking.jpg';
import eventImg3 from '@/shared/assets/images/beneficios.jpg';

export default function Home() {
  // =====================================================================
  // APARTADO DE CONFIGURACIÓN DEL BANNER (¡Modifica a tu gusto aquí!)
  // =====================================================================
  const backgroundOpacity = "opacity-100"; // Intensidad de la transparencia
  const imagePosition = "object-center";    // Posición interna
  const imageZoom = "scale-100";            // Zoom interno

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-white">
      
      {/* Barra de Navegación Superior */}
      <Navbar />

      {/* Contenido Principal con contenedor fluido y adaptable a cualquier ancho */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex-grow space-y-8">
        
        {/* Banner Principal PWA Shell (100% adaptable) */}
        <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#111827] text-white p-6 sm:p-10 md:p-12 shadow-lg">
          
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <Image 
              src={umssBg} 
              alt="Fondo Institucional UMSS" 
              fill 
              sizes="(max-width: 1440px) 100vw, 1440px"
              className={`object-cover ${imagePosition} ${imageZoom} ${backgroundOpacity} transition-transform duration-500`}
              priority
            />
            <div className="absolute inset-0 bg-[#0F172A]/60"></div>
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <h3 className="text-xs sm:text-sm font-medium text-slate-300 font-sans tracking-wide">Bienvenido a</h3>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
              UMSS<span className="text-amber-500">PIRA</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-normal font-sans">
              Tu comunidad, siempre conectada.
            </p>

            {/* Barra de Búsqueda Integrada */}
            <div className="pt-2">
              <div className="relative max-w-xl">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="Busque eventos, beneficios, empleos..." 
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-sm placeholder:text-slate-400 font-sans transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tarjetas de Navegación Rápida (4 Tarjetas Superiores Fluidas) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Tarjeta 1: Eventos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">Eventos</h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">Participa en los próximos eventos y actividades.</p>
            </div>
          </div>

          {/* Tarjeta 2: Bolsa de trabajo */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">Bolsa de trabajo</h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">Encuentra nuevas oportunidades laborales.</p>
            </div>
          </div>

          {/* Tarjeta 3: Beneficios */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">Beneficios</h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">Accede a descuentos y convenios exclusivos.</p>
            </div>
          </div>

          {/* Tarjeta 4: Comunidad */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">Comunidad</h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">Conecta con otros egresados.</p>
            </div>
          </div>

        </section>

        {/* Sección de Próximos Eventos */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">Próximos eventos</h2>
            <a href="#all-events" className="text-xs font-semibold text-amber-600 hover:underline flex items-center space-x-1 font-sans">
              <span>Ver todos</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Grid de Eventos con adaptabilidad total a cualquier navegador y tamaño de pantalla */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Evento 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-36 sm:h-32 bg-slate-200 relative">
                <Image 
                  src={eventImg1} 
                  alt="Reencuentro de Egresados" 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full text-slate-700 shadow z-10 cursor-pointer hover:bg-white transition-colors">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
              <div className="p-4 sm:p-5 relative flex-1 flex flex-col justify-between space-y-4">
                {/* Badge de Fecha */}
                <div className="absolute -top-6 left-4 bg-[#A34739] text-white px-3 py-1.5 rounded-xl shadow text-center z-10">
                  <span className="block text-base font-bold leading-none font-sans">12</span>
                  <span className="block text-[10px] uppercase font-semibold tracking-wider font-sans">OCT</span>
                </div>
                
                <div className="pt-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">Reencuentro de Egresados</h3>
                  <div className="space-y-1 mt-2 text-xs text-slate-500 font-sans">
                    <p className="flex items-center space-x-1.5"><span>📍</span><span>Auditorio UMSS</span></p>
                    <p className="flex items-center space-x-1.5"><span>⏰</span><span>8:00 p.m. - 12:00 p.m.</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Evento 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-36 sm:h-32 bg-slate-200 relative">
                <Image 
                  src={eventImg2} 
                  alt="Charla de Networking" 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full text-slate-700 shadow z-10 cursor-pointer hover:bg-white transition-colors">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
              <div className="p-4 sm:p-5 relative flex-1 flex flex-col justify-between space-y-4">
                <div className="absolute -top-6 left-4 bg-[#A34739] text-white px-3 py-1.5 rounded-xl shadow text-center z-10">
                  <span className="block text-base font-bold leading-none font-sans">25</span>
                  <span className="block text-[10px] uppercase font-semibold tracking-wider font-sans">OCT</span>
                </div>
                
                <div className="pt-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">Charla de Networking</h3>
                  <div className="space-y-1 mt-2 text-xs text-slate-500 font-sans">
                    <p className="flex items-center space-x-1.5"><span>📍</span><span>Aula Magna</span></p>
                    <p className="flex items-center space-x-1.5"><span>⏰</span><span>8:00 p.m. - 7:00 p.m.</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Evento 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-36 sm:h-32 bg-slate-200 relative">
                <Image 
                  src={eventImg3} 
                  alt="Feria de Beneficios" 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full text-slate-700 shadow z-10 cursor-pointer hover:bg-white transition-colors">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
              <div className="p-4 sm:p-5 relative flex-1 flex flex-col justify-between space-y-4">
                <div className="absolute -top-6 left-4 bg-[#A34739] text-white px-3 py-1.5 rounded-xl shadow text-center z-10">
                  <span className="block text-base font-bold leading-none font-sans">08</span>
                  <span className="block text-[10px] uppercase font-semibold tracking-wider font-sans">NOV</span>
                </div>
                
                <div className="pt-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">Feria de Beneficios</h3>
                  <div className="space-y-1 mt-2 text-xs text-slate-500 font-sans">
                    <p className="flex items-center space-x-1.5"><span>📍</span><span>Campus UMSS</span></p>
                    <p className="flex items-center space-x-1.5"><span>⏰</span><span>9:30 p.m. - 4:00 p.m.</span></p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

    </div>
  );
}
