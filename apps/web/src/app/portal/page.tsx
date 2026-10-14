import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, Briefcase, Star, Users, ChevronRight, Bookmark } from 'lucide-react';

import umssBg from '@/shared/assets/images/14sept.webp';
import eventImg1 from '@/shared/assets/images/reencuentro.jpg';
import eventImg2 from '@/shared/assets/images/networking.jpg';
import eventImg3 from '@/shared/assets/images/beneficios.jpg';

const quickLinks = [
  { href: '/portal/eventos', title: 'Eventos', text: 'Participa en los próximos eventos y actividades.', Icon: Calendar, iconStyle: 'bg-amber-50 text-amber-600' },
  { href: '/portal/empleos', title: 'Bolsa de trabajo', text: 'Encuentra nuevas oportunidades laborales.', Icon: Briefcase, iconStyle: 'bg-blue-50 text-blue-600' },
  { href: '/portal/beneficios', title: 'Beneficios', text: 'Accede a descuentos y convenios exclusivos.', Icon: Star, iconStyle: 'bg-amber-50 text-amber-600' },
  { href: '/portal/comunidad', title: 'Comunidad', text: 'Conecta con otros egresados.', Icon: Users, iconStyle: 'bg-slate-100 text-slate-700' },
];

const events = [
  { img: eventImg1, title: 'Reencuentro de Egresados', day: '12', month: 'OCT', place: 'Auditorio UMSS', time: '8:00 a.m. - 12:00 p.m.' },
  { img: eventImg2, title: 'Charla de Networking', day: '25', month: 'OCT', place: 'Aula Magna', time: '8:00 a.m. - 7:00 p.m.' },
  { img: eventImg3, title: 'Feria de Beneficios', day: '08', month: 'NOV', place: 'Campus UMSS', time: '9:30 a.m. - 4:00 p.m.' },
];

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 w-full space-y-8 font-sans text-slate-900">
      {/* Banner principal */}
      <section className="relative w-full rounded-2xl overflow-hidden bg-[#111827] text-white p-6 sm:p-8 md:p-12 shadow-lg">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={umssBg}
            alt="Fondo Institucional UMSS"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[#0F172A]/60"></div>
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Bienvenido a</h3>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">
            UMSS<span className="text-amber-500">PIRA</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base">Tu comunidad, siempre conectada.</p>

          <div className="pt-2">
            <div className="relative max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="search"
                aria-label="Buscar eventos, beneficios y empleos"
                placeholder="Busque eventos, beneficios, empleos..."
                className="w-full min-h-[44px] pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {quickLinks.map(({ href, title, text, Icon, iconStyle }) => (
          <Link
            key={href}
            href={href}
            className="h-full min-h-[44px] bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyle}`}>
                <Icon className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{text}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Próximos eventos */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-slate-900">Próximos eventos</h2>
          <Link
            href="/portal/eventos"
            className="min-h-[44px] px-2 text-xs font-semibold text-amber-600 hover:underline flex items-center space-x-1"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((ev) => (
            <article
              key={ev.title}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-32 bg-slate-200 relative">
                <Image
                  src={ev.img}
                  alt={ev.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  aria-label={`Guardar ${ev.title}`}
                  className="absolute top-1 right-1 z-10 w-11 h-11 flex items-center justify-center"
                >
                  <span className="bg-white/90 p-1.5 rounded-full text-slate-700 shadow">
                    <Bookmark className="w-4 h-4" />
                  </span>
                </button>
              </div>
              <div className="p-4 relative flex-1 flex flex-col justify-between space-y-4">
                <div className="absolute -top-6 left-4 bg-[#A34739] text-white px-3 py-1.5 rounded-xl shadow text-center z-10">
                  <span className="block text-base font-bold leading-none">{ev.day}</span>
                  <span className="block text-[10px] uppercase font-semibold tracking-wider">{ev.month}</span>
                </div>
                <div className="pt-3">
                  <h3 className="font-bold text-slate-900 text-sm">{ev.title}</h3>
                  <div className="space-y-1 mt-2 text-xs text-slate-500">
                    <p className="flex items-center space-x-1.5"><span>📍</span><span>{ev.place}</span></p>
                    <p className="flex items-center space-x-1.5"><span>⏰</span><span>{ev.time}</span></p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}