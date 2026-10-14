import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, Building2, Users, GraduationCap, Award, 
  MessageSquare, Briefcase, Calendar, Star, ChevronRight 
} from 'lucide-react';

// Importamos el Navbar público independiente
import PublicNavbar from '@/shared/components/publicnavbar';

// Importamos la imagen de fondo principal y el sello institucional
import umssBg from '@/shared/assets/images/14sept.webp';
import selloImg from '@/shared/assets/images/sello.png';

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-white">
      
      {/* 🧭 Navbar Superior Público Modular */}
      <PublicNavbar />

      {/* 🌟 Banner Principal Institucional */}
      <section className="relative w-full bg-[#0F172A] text-white overflow-hidden">
        
        {/* Fondo con imagen y capa oscura traslúcida */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-100">
          <Image 
            src={umssBg} 
            alt="Fondo Institucional UMSS" 
            fill 
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[#0F172A]/70"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col justify-between min-h-[520px]">
          
          <div className="max-w-2xl space-y-6">
            <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
              — UNIVERSIDAD MAYOR DE SAN SIMÓN · FUNDADA EN 1832
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
              Un legado que se lleva <span className="text-amber-500">de por vida.</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              La red oficial de egresados de la UMSS: el lugar donde tu formación sigue abriendo puertas, y donde cada promoción sostiene a la siguiente.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link 
                href="/register" 
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-md flex items-center space-x-2"
              >
                <span>SOLICITAR MI ACCESO</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/login" 
                className="px-6 py-3.5 bg-transparent hover:bg-white/10 text-white border border-white/40 font-semibold rounded-xl text-sm transition-all"
              >
                YA SOY MIEMBRO →
              </Link>
            </div>
          </div>

          {/* 🛡️ Sello / Insignia Institucional Circular con Imagen (Derecha) */}
          <div className="hidden lg:flex absolute right-12 bottom-12 flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-amber-500/60 bg-[#0F172A]/90 backdrop-blur-sm p-4 text-center shadow-xl">
            <div className="w-10 h-10 relative mb-1">
              <Image src={selloImg} alt="Sello Institucional" fill className="object-contain" />
            </div>
            <span className="text-[10px] tracking-widest uppercase text-amber-400 font-bold">EST. 1832</span>
            <span className="text-[9px] text-slate-300 leading-none mt-0.5">Ciencia Conocimiento Sociedad</span>
          </div>

        </div>
      </section>

      {/* 📊 Barra de Estadísticas Institucionales (Inferior del Banner) */}
      <section className="bg-[#0F172A] border-t border-slate-800 text-white py-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          
          <div className="space-y-1">
            <div className="flex justify-center text-amber-500 mb-2"><Building2 className="w-6 h-6" /></div>
            <h3 className="text-3xl font-serif font-bold text-amber-400">194</h3>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">AÑOS DE TRAYECTORIA</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-center text-amber-500 mb-2"><Users className="w-6 h-6" /></div>
            <h3 className="text-3xl font-serif font-bold text-amber-400">28</h3>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">PROMOCIONES CONECTADAS</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-center text-amber-500 mb-2"><GraduationCap className="w-6 h-6" /></div>
            <h3 className="text-3xl font-serif font-bold text-amber-400">+4,200</h3>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">EGRESADOS REGISTRADOS</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-center text-amber-500 mb-2"><Award className="w-6 h-6" /></div>
            <h3 className="text-3xl font-serif font-bold text-amber-400">Gratuito</h3>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">PARA TITULADOS UMSS</p>
          </div>

        </div>
      </section>

      {/* 🚀 NUEVA SECCIÓN: ¿Qué puedes hacer aquí? */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">LA PLATAFORMA</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">¿Qué puedes hacer aquí?</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Todo lo que necesitas para mantenerte conectado con la comunidad de Ingeniería de Sistemas, en un solo lugar.
          </p>
        </div>

        {/* Tarjetas de características */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Tarjeta 1: Foro */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Foro de discusión</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Comparte experiencias, resuelve dudas técnicas y conversa con otros egresados por temas.
              </p>
            </div>
            <a href="#foro" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1">
              <span>Explorar el foro</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tarjeta 2: Bolsa de trabajo */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Bolsa de trabajo</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Encuentra ofertas publicadas por empresas y otros egresados, filtradas por área y modalidad.
              </p>
            </div>
            <a href="#empleos" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1">
              <span>Ver vacantes</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tarjeta 3: Mentoría */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Mentoría</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Conecta con egresados dispuestos a guiarte, o sé mentor de una nueva generación.
              </p>
            </div>
            <a href="#mentorias" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1">
              <span>Buscar mentor</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tarjeta 4: Eventos */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Eventos</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Talleres, hackatones y encuentros presenciales o virtuales para toda la comunidad ISI.
              </p>
            </div>
            <a href="#eventos" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1">
              <span>Ver calendario</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>

      {/* 💬 NUEVA SECCIÓN: Últimos temas del foro & Próximos eventos */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Columna Izquierda: Foro */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-slate-900">Últimos temas del foro</h3>
            <p className="text-xs text-slate-500">Lo que se está conversando ahora mismo</p>
          </div>

          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            
            <div className="pb-4 border-b border-slate-100 flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                DR
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Bolsa de trabajo</span>
                <h4 className="text-sm font-bold text-slate-900 hover:text-amber-600 cursor-pointer">
                  ¿Alguien tiene experiencia trabajando remoto para empresas de EE.UU.?
                </h4>
                <p className="text-xs text-slate-400">24 respuestas · hace 2 horas</p>
              </div>
            </div>

            <div className="pb-4 border-b border-slate-100 flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                CV
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Proyectos</span>
                <h4 className="text-sm font-bold text-slate-900 hover:text-amber-600 cursor-pointer">
                  Buscamos backend developer para proyecto open source
                </h4>
                <p className="text-xs text-slate-400">12 respuestas · hace 5 horas</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                JM
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Tecnología</span>
                <h4 className="text-sm font-bold text-slate-900 hover:text-amber-600 cursor-pointer">
                  Recomendaciones para la certificación AWS Solutions Architect
                </h4>
                <p className="text-xs text-slate-400">31 respuestas · hace 1 día</p>
              </div>
            </div>

          </div>

          <a href="#foro" className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-700 space-x-1">
            <span>Ver todo el foro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Columna Derecha: Próximos eventos */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-slate-900">Próximos eventos</h3>
            <p className="text-xs text-slate-500">Agenda tu lugar en la comunidad</p>
          </div>

          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            
            <div className="pb-4 border-b border-slate-100 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white flex flex-col items-center justify-center font-bold shrink-0">
                <span className="text-sm leading-none">28</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400">AGO</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Taller: Desarrollo Web Moderno</h4>
                <p className="text-xs text-slate-500">Facultad de Ciencias y Tecnología</p>
              </div>
            </div>

            <div className="pb-4 border-b border-slate-100 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white flex flex-col items-center justify-center font-bold shrink-0">
                <span className="text-sm leading-none">30</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400">AGO</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Encuentro de Egresados ISI</h4>
                <p className="text-xs text-slate-500">UMSS — Cochabamba</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white flex flex-col items-center justify-center font-bold shrink-0">
                <span className="text-sm leading-none">05</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400">SEP</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Hackatón ISI UMSS</h4>
                <p className="text-xs text-slate-500">Campus Universitario</p>
              </div>
            </div>

          </div>

          <a href="#eventos" className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-700 space-x-1">
            <span>Ver todos los eventos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </section>

      {/* 🏢 Empresas Aliadas */}
      <section className="py-12 border-y border-slate-200/60 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            EGRESADOS DE SISTEMAS UMSS TRABAJANDO EN
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 text-slate-600 font-serif text-xl sm:text-2xl font-semibold opacity-75">
            <span>TechCorp</span>
            <span>DataForge</span>
            <span>CloudNine</span>
            <span>Nébula Labs</span>
            <span>Vantia</span>
          </div>
        </div>
      </section>

      {/* 💼 Sección de Reclutamiento (¿Buscas talento en Sistemas?) */}
      <section className="bg-[#FFD3B6]/40 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              ¿Buscas talento en Sistemas?
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Publica una vacante y llega directo a más de 4,200 mil egresados verificados de Sistemas e Informática de la UMSS.
            </p>
          </div>
          <button className="px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer">
            <span>Publicar una vacante</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </section>

      {/* ⚓ Pie de Página (Footer Institucional) */}
      <footer className="bg-[#0F172A] text-slate-300 py-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          
          {/* Info principal */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-white font-bold text-base">UMSS · Red de Egresados</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              La red oficial de egresados de la Facultad de Ciencias y Tecnología, UMSS.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs hover:bg-slate-700 cursor-pointer">in</span>
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs hover:bg-slate-700 cursor-pointer">𝕏</span>
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs hover:bg-slate-700 cursor-pointer">f</span>
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs hover:bg-slate-700 cursor-pointer">ig</span>
            </div>
          </div>

          {/* Portal */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Portal</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Inicio</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Foro</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Directorio</a></li>
            </ul>
          </div>

          {/* Comunidad */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Comunidad</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Empleos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Eventos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mentoría</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
            </ul>
          </div>

          {/* Mantente al día (Newsletter) */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Mantente al día</h5>
            <div className="space-y-2">
              <input 
                type="email" 
                placeholder="tu@correo.com" 
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button className="w-full py-2.5 bg-[#FFB162] hover:bg-[#f39c4a] text-slate-900 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer">
                Suscribirme
              </button>
            </div>
          </div>

        </div>

        {/* Derechos reservados */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Red de Egresados — Ingeniería de Sistemas, FCyT, UMSS</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-slate-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
