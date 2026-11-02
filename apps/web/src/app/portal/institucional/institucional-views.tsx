'use client';
import React, { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight, Building2, Users, GraduationCap, Award, MessageSquare, Clock,
  Briefcase, Calendar, ChevronRight, ChevronDown, MapPin, Lock, Target, Eye,
  BookOpen, Cpu, Code2, Database, Network, Globe, Quote, ShieldCheck,
  UserCheck, Search, Mic, Trophy, Lightbulb, Rocket, Terminal, Sparkles, Heart,
} from 'lucide-react';

import umssBg from '@/shared/assets/images/14sept.webp';
import selloImg from '@/shared/assets/images/sello.png';

const T = (tab: string) => `/portal/institucional?tab=${tab}`;

type IconType = React.ComponentType<{ className?: string }>;

/* ---------- Piezas reutilizables ---------- */

function TabImage({
  src, alt, Icon, className = '',
}: { src: string; alt: string; Icon: IconType; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center ${className}`}>
        <Icon className="w-20 h-20 text-amber-400/80" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}

function TabHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="relative w-full bg-[#0F172A] text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src={umssBg} alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-[#0F172A]/80"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-3">— {eyebrow}</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight leading-tight max-w-3xl">{title}</h1>
        <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">{text}</p>
      </div>
    </section>
  );
}

function LoginCta({ title, text }: { title: string; text: string }) {
  return (
    <section className="bg-[#FFD3B6]/40 py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h3 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" /> {title}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link href="/login" className="px-6 py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md">
            Iniciar sesión
          </Link>
          <Link href="/register" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-md">
            Crear cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow, title, text, center = false,
}: { eyebrow: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={`space-y-2 mb-8 ${center ? 'text-center' : ''}`}>
      <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">{eyebrow}</p>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">{title}</h2>
      {text && <p className={`text-sm text-slate-600 leading-relaxed ${center ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}>{text}</p>}
    </div>
  );
}

function Steps({ items, cols = 'md:grid-cols-3' }: { items: { t: string; d: string }[]; cols?: string }) {
  return (
    <div className={`grid grid-cols-1 ${cols} gap-6`}>
      {items.map((x, i) => (
        <div key={x.t} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-serif font-bold text-lg">
            {i + 1}
          </div>
          <h3 className="text-base font-bold text-slate-900">{x.t}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{x.d}</p>
        </div>
      ))}
    </div>
  );
}

function IconCards({
  items, cols = 'md:grid-cols-3',
}: { items: { Icon: IconType; t: string; d: string }[]; cols?: string }) {
  return (
    <div className={`grid grid-cols-1 ${cols} gap-6`}>
      {items.map(({ Icon, t, d }) => (
        <div key={t} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{t}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{d}</p>
        </div>
      ))}
    </div>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3 max-w-3xl">
      {items.map((x, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={x.q} className="bg-[#F5F2EA] rounded-2xl border border-[#C9C1B1] shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
            >
              <span className="text-sm font-bold text-slate-900">{x.q}</span>
              <ChevronDown className={`w-5 h-5 text-amber-600 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <p className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">{x.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

function Block({ children, bg = '' }: { children: React.ReactNode; bg?: string }) {
  return (
    <section className={`py-14 px-4 sm:px-6 lg:px-8 ${bg || 'bg-[#EEE9DF]'}`}>
      <div className="max-w-7xl mx-auto w-full">{children}</div>
    </section>
  );
}

function PhotoCards({
  items, cols = 'md:grid-cols-3',
}: { items: { Icon: IconType; t: string; d: string; img: string }[]; cols?: string }) {
  return (
    <div className={`grid grid-cols-1 ${cols} gap-6`}>
      {items.map(({ Icon, t, d, img }) => (
        <div key={t} className="bg-[#F5F2EA] rounded-2xl border border-[#C9C1B1] shadow-sm overflow-hidden flex flex-col">
          <TabImage src={img} alt={t} Icon={Icon} className="w-full h-44" />
          <div className="p-6 space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SplitBlock({
  img, alt, Icon, reverse = false, bg = '', children,
}: { img: string; alt: string; Icon: IconType; reverse?: boolean; bg?: string; children: React.ReactNode }) {
  return (
    <Block bg={bg}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <TabImage
          src={img}
          alt={alt}
          Icon={Icon}
          className={`w-full h-80 rounded-2xl shadow-md ${reverse ? 'lg:order-last' : ''}`}
        />
        <div>{children}</div>
      </div>
    </Block>
  );
}

/* ---------- INICIO ---------- */

function HomeView() {
  return (
    <>
      <section className="relative w-full bg-[#0F172A] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src={umssBg} alt="Fondo Institucional UMSS" fill className="object-cover object-center" priority />
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
              La red oficial de titulados de la UMSS: el lugar donde tu formación sigue abriendo puertas, y donde cada promoción sostiene a la siguiente.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/register" className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-md flex items-center space-x-2">
                <span>SOLICITAR MI ACCESO</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="px-6 py-3.5 bg-transparent hover:bg-white/10 text-white border border-white/40 font-semibold rounded-xl text-sm transition-all">
                YA SOY MIEMBRO →
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex absolute right-12 bottom-12 flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-amber-500/60 bg-[#0F172A]/90 backdrop-blur-sm p-4 text-center shadow-xl">
            <div className="w-10 h-10 relative mb-1">
              <Image src={selloImg} alt="Sello Institucional" fill className="object-contain" />
            </div>
            <span className="text-[10px] tracking-widest uppercase text-amber-400 font-bold">EST. 1832</span>
            <span className="text-[9px] text-slate-300 leading-none mt-0.5">Ciencia Conocimiento Sociedad</span>
          </div>
        </div>
      </section>

      <section className="bg-[#0F172A] border-t border-slate-800 text-white py-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { Icon: Building2, n: '194', l: 'AÑOS DE TRAYECTORIA' },
            { Icon: Users, n: '28', l: 'PROMOCIONES CONECTADAS' },
            { Icon: GraduationCap, n: '+4,200', l: 'TITULADOS REGISTRADOS' },
            { Icon: Award, n: 'Gratuito', l: 'PARA TITULADOS UMSS' },
          ].map(({ Icon, n, l }) => (
            <div key={l} className="space-y-1">
              <div className="flex justify-center text-amber-500 mb-2"><Icon className="w-6 h-6" /></div>
              <h3 className="text-3xl font-serif font-bold text-amber-400">{n}</h3>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">LA PLATAFORMA</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">¿Qué puedes hacer aquí?</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Todo lo que necesitas para mantenerte conectado con la comunidad de Ingeniería de Sistemas, en un solo lugar.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { Icon: MessageSquare, t: 'Foro de discusión', d: 'Comparte experiencias, resuelve dudas técnicas y conversa con otros titulados por temas.', href: T('comunidad'), l: 'Explorar el foro' },
            { Icon: Briefcase, t: 'Bolsa de trabajo', d: 'Encuentra ofertas publicadas por empresas y otros titulados, filtradas por área y modalidad.', href: T('empleos'), l: 'Ver vacantes' },
            { Icon: Users, t: 'Mentoría', d: 'Conecta con titulados dispuestos a guiarte, o sé mentor de una nueva generación.', href: T('mentorias'), l: 'Buscar mentor' },
            { Icon: Calendar, t: 'Eventos', d: 'Talleres, hackatones y encuentros presenciales o virtuales para toda la comunidad ISI.', href: T('eventos'), l: 'Ver calendario' },
          ].map(({ Icon, t, d, href, l }) => (
            <div key={t} className="bg-[#F5F2EA] p-8 rounded-2xl border border-[#C9C1B1] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
                <h3 className="text-xl font-serif font-bold text-slate-900">{t}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{d}</p>
              </div>
              <Link href={href} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1">
                <span>{l}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-600 font-bold mb-2">POR QUÉ UNIRTE</p>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Una red hecha por titulados, para titulados
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Tu título te dio las bases. La red te da el camino que sigue.
            </p>
          </div>
          <div className="space-y-4 bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm">
            {[
              { Icon: Users, t: 'Contactos que abren puertas', d: 'Reencuentra a tu promoción y conoce a profesionales de otras generaciones.' },
              { Icon: Briefcase, t: 'Oportunidades laborales', d: 'Accede a ofertas publicadas por empresas y por otros titulados.' },
              { Icon: GraduationCap, t: 'Mentoría real', d: 'Aprende de quienes ya recorrieron el camino, o guía a quienes vienen detrás.' },
            ].map(({ Icon, t, d }, idx, arr) => (
              <div key={t} className={`flex items-start space-x-4 ${idx < arr.length - 1 ? 'pb-4 border-b border-[#D6CFC2]' : ''}`}>
                <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{t}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-600 font-bold mb-2">CÓMO EMPEZAR</p>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">Tu lugar en la red en 3 pasos</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Es gratuito para titulados de la UMSS.</p>
          </div>
          <div className="space-y-4 bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm">
            {[
              { n: '1', t: 'Solicita tu acceso', d: 'Completa el registro con tus datos de titulado.' },
              { n: '2', t: 'Valida tu perfil', d: 'Confirmamos que perteneces a la comunidad de Sistemas e Informática.' },
              { n: '3', t: 'Conecta y participa', d: 'Explora el directorio, la comunidad y todo lo que la red ofrece.' },
            ].map((x, idx, arr) => (
              <div key={x.n} className={`flex items-start space-x-4 ${idx < arr.length - 1 ? 'pb-4 border-b border-[#D6CFC2]' : ''}`}>
                <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-serif font-bold text-lg shrink-0">
                  {x.n}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{x.t}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/register" className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-700 space-x-1">
            <span>Solicitar mi acceso</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <Block bg="bg-[#E7E1D4]">
        <SectionHead
          center
          eyebrow="LO QUE OFRECE LA RED"
          title="Más que un directorio de contactos"
          text="Herramientas pensadas para cada etapa de tu vida profesional."
        />
        <PhotoCards
          cols="md:grid-cols-2 lg:grid-cols-4"
          items={[
            { Icon: Search, img: '/images/institucional/red-directorio.jpg', t: 'Directorio de titulados', d: 'Encuentra colegas por promoción, especialidad, empresa o ciudad.' },
            { Icon: Rocket, img: '/images/institucional/red-desarrollo.jpg', t: 'Desarrollo profesional', d: 'Mentorías, talleres y recursos para dar el siguiente paso en tu carrera.' },
            { Icon: Trophy, img: '/images/institucional/red-eventos.jpg', t: 'Eventos y hackatones', d: 'Participa en encuentros que fortalecen tus habilidades y tu red.' },
            { Icon: Heart, img: '/images/institucional/red-umss.jpg', t: 'Compromiso con la UMSS', d: 'Apoya a las nuevas generaciones y mantén vivo el vínculo con tu universidad.' },
          ]}
        />
      </Block>

      <Block>
        <SectionHead
          center
          eyebrow="VOCES DE LA RED"
          title="Lo que se vive dentro de la comunidad"
          text="Testimonios de ejemplo para ilustrar la experiencia. No corresponden a personas reales."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { i: 'AB', n: 'Titulado de Sistemas', r: 'Backend Developer', q: 'Reencontrarme con mi promoción me abrió una oportunidad laboral que no esperaba.' },
            { i: 'CD', n: 'Titulada de Informática', r: 'Analista de datos', q: 'Mi mentor me ayudó a ordenar mis metas y a preparar mi primera entrevista técnica.' },
            { i: 'EF', n: 'Titulada de Sistemas', r: 'Arquitecta de software', q: 'Ahora guío a quienes recién se gradúan; es mi forma de devolver lo que recibí.' },
          ].map((x) => (
            <figure key={x.i} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm flex flex-col gap-4">
              <Quote className="w-7 h-7 text-amber-500" />
              <blockquote className="text-sm text-slate-700 leading-relaxed flex-1">“{x.q}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#0F172A] text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">{x.i}</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{x.n}</p>
                  <p className="text-xs text-slate-500">{x.r}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Block>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/inicio-egresados.jpg" alt="Titulados UMSS" Icon={GraduationCap}>
        <SectionHead eyebrow="PREGUNTAS FRECUENTES" title="Antes de empezar" />
        <Faq
          items={[
            { q: '¿Quiénes pueden unirse a la red?', a: 'Titulados de Ingeniería de Sistemas e Ingeniería Informática de la UMSS.' },
            { q: '¿Tiene algún costo?', a: 'No. La red es gratuita para titulados de la UMSS.' },
            { q: '¿Cómo valido que soy titulado?', a: 'Al registrarte completas tus datos de titulado y revisamos tu información para confirmar tu pertenencia a la comunidad.' },
            { q: '¿Puedo publicar ofertas de trabajo?', a: 'Sí. Las empresas y los titulados pueden publicar vacantes una vez que tienen una cuenta.' },
          ]}
        />
      </SplitBlock>

      <section className="py-12 border-y border-slate-200/60 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">TITULADOS DE SISTEMAS UMSS TRABAJANDO EN</p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 text-slate-600 font-serif text-xl sm:text-2xl font-semibold opacity-75">
            <span>TechCorp</span><span>DataForge</span><span>CloudNine</span><span>Nébula Labs</span><span>Vantia</span>
          </div>
        </div>
      </section>

      <section className="bg-[#FFD3B6]/40 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">¿Buscas talento en Sistemas?</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Publica una vacante y llega directo a más de 4,200 titulados verificados de Sistemas e Informática de la UMSS.
            </p>
          </div>
          <Link href="/register" className="px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 shrink-0">
            <span>Publicar una vacante</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </section>
    </>
  );
}

/* ---------- COMUNIDAD ---------- */

export function ComunidadView() {
  return (
    <>
      <TabHero
        eyebrow="COMUNIDAD"
        title="Una red que te acompaña después de graduarte"
        text="La comunidad UMSSPIRA reúne a titulados de Ingeniería de Sistemas e Ingeniería Informática para aprender juntos, abrirse puertas y apoyar a las nuevas generaciones."
      />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">QUÉ ES LA COMUNIDAD</p>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Titulados que se ayudan entre sí</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Aquí encuentras a quienes ya recorrieron el camino que tú estás empezando: colegas de tu promoción, profesionales de otras generaciones y mentores dispuestos a compartir lo que aprendieron.
          </p>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Cada conversación, consejo o recomendación fortalece a toda la red.
          </p>
        </div>
        <TabImage src="/images/institucional/comunidad.jpg" alt="Comunidad de titulados UMSS" Icon={Users} className="w-full h-72 rounded-2xl shadow-md" />
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: MessageSquare, t: 'Foro de discusión', d: 'Plantea dudas técnicas, comparte experiencias y participa en conversaciones por tema.' },
            { Icon: Users, t: 'Mentoría', d: 'Conecta con titulados que te guían en tu carrera, o conviértete en mentor.' },
            { Icon: GraduationCap, t: 'Grupos por promoción', d: 'Mantén el vínculo con quienes se graduaron contigo y reencuéntrate con ellos.' },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="bg-[#F5F2EA] p-8 rounded-2xl border border-[#C9C1B1] shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
              <h3 className="text-xl font-serif font-bold text-slate-900">{t}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <Block bg="bg-[#E7E1D4]">
        <SectionHead
          eyebrow="DE QUÉ SE CONVERSA"
          title="Temas que reúnen a la comunidad"
          text="El foro está organizado por categorías para que encuentres rápido lo que te interesa."
        />
        <PhotoCards
          cols="md:grid-cols-2 lg:grid-cols-4"
          items={[
            { Icon: Briefcase, img: '/images/institucional/tema-trabajo.jpg', t: 'Bolsa de trabajo', d: 'Ofertas, consejos para entrevistas y trabajo remoto.' },
            { Icon: Terminal, img: '/images/institucional/tema-tecnologia.jpg', t: 'Tecnología', d: 'Lenguajes, herramientas, nube y buenas prácticas.' },
            { Icon: Lightbulb, img: '/images/institucional/tema-proyectos.jpg', t: 'Proyectos', d: 'Ideas, equipos y proyectos abiertos que buscan colaboradores.' },
            { Icon: GraduationCap, img: '/images/institucional/tema-formacion.jpg', t: 'Formación', d: 'Certificaciones, posgrados y recursos para seguir aprendiendo.' },
          ]}
        />
      </Block>

      <SplitBlock img="/images/institucional/mentoria.jpg" alt="Mentoría entre titulados" Icon={Users} reverse>
        <SectionHead
          eyebrow="MENTORÍA"
          title="Cómo funciona la mentoría"
          text="Un proceso sencillo para conectar a quien quiere aprender con quien puede guiar."
        />
        <Steps
          cols="md:grid-cols-1"
          items={[
            { t: 'Crea tu perfil', d: 'Cuéntanos tu experiencia y qué te gustaría aprender o enseñar.' },
            { t: 'Encuentra a tu mentor', d: 'Busca por área o especialidad y envía tu solicitud.' },
            { t: 'Avancen juntos', d: 'Acuerden objetivos y encuentros para trabajar en tu crecimiento profesional.' },
          ]}
        />
      </SplitBlock>

      <Block bg="bg-[#E7E1D4]">
        <SectionHead
          eyebrow="CONVIVENCIA"
          title="Nuestras normas de la comunidad"
          text="Para que la red siga siendo un espacio útil y amable para todos."
        />
        <PhotoCards
          items={[
            { Icon: Heart, img: '/images/institucional/norma-respeto.jpg', t: 'Respeto', d: 'Tratamos a cada persona con cortesía, sin importar su promoción o experiencia.' },
            { Icon: ShieldCheck, img: '/images/institucional/norma-informacion.jpg', t: 'Información confiable', d: 'Compartimos datos verificados y citamos las fuentes cuando corresponde.' },
            { Icon: Sparkles, img: '/images/institucional/norma-valor.jpg', t: 'Aportar valor', d: 'Cada publicación busca ayudar, enseñar o abrir una oportunidad.' },
          ]}
        />
      </Block>

      <SplitBlock img="/images/institucional/comunidad-faq.jpg" alt="Preguntas sobre la comunidad" Icon={MessageSquare}>
        <SectionHead eyebrow="PREGUNTAS FRECUENTES" title="Sobre la comunidad" />
        <Faq
          items={[
            { q: '¿Necesito una cuenta para leer el foro?', a: 'Para participar, publicar o pedir una mentoría necesitas iniciar sesión.' },
            { q: '¿Puedo ser mentor si me gradué hace poco?', a: 'Sí. Todo titulado tiene experiencia que compartir, sin importar el año de su promoción.' },
            { q: '¿Cómo me uno al grupo de mi promoción?', a: 'Al crear tu cuenta indicas tu año de promoción y se te asigna a su grupo.' },
          ]}
        />
      </SplitBlock>

      <LoginCta
        title="Únete a la conversación"
        text="Para publicar en el foro, pedir una mentoría o unirte a tu promoción necesitas iniciar sesión."
      />
    </>
  );
}

/* ---------- DIRECTORIO ---------- */

function DirectorioView() {
  return (
    <>
      <TabHero
        eyebrow="DIRECTORIO"
        title="Encuentra a los titulados de tu facultad"
        text="El directorio conecta a profesionales de Sistemas e Informática de la UMSS para facilitar colaboraciones, referencias y oportunidades."
      />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <TabImage src="/images/institucional/directorio.jpg" alt="Directorio de titulados" Icon={Network} className="w-full h-72 rounded-2xl shadow-md order-last lg:order-first" />
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">PARA QUÉ SIRVE</p>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Un contacto puede cambiar tu camino</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Busca colegas por promoción, área de especialidad, empresa o ciudad. Reconecta con compañeros, pide una recomendación o encuentra a la persona indicada para tu próximo proyecto.
          </p>
        </div>
      </section>

      <section className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6">Podrás buscar por</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { Icon: GraduationCap, t: 'Promoción' },
            { Icon: Cpu, t: 'Área de especialidad' },
            { Icon: Building2, t: 'Empresa' },
            { Icon: MapPin, t: 'Ciudad o país' },
          ].map(({ Icon, t }) => (
            <div key={t} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
              <p className="text-sm font-bold text-slate-900">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-1">Así se ve un perfil</h3>
        <p className="text-xs text-slate-500 mb-6">Perfiles de ejemplo, no corresponden a personas reales.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { i: 'AB', r: 'Backend Developer', p: 'Promoción 2018 · Ing. de Sistemas' },
            { i: 'CD', r: 'Analista de Datos', p: 'Promoción 2020 · Ing. Informática' },
            { i: 'EF', r: 'Arquitecta de Software', p: 'Promoción 2014 · Ing. de Sistemas' },
          ].map((x) => (
            <div key={x.i} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0F172A] text-amber-400 flex items-center justify-center font-bold shrink-0">{x.i}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{x.r}</p>
                <p className="text-xs text-slate-500">{x.p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/directorio-busqueda.jpg" alt="Búsqueda en el directorio" Icon={Search}>
        <SectionHead eyebrow="CÓMO FUNCIONA" title="Encuentra a la persona indicada en 3 pasos" />
        <Steps
          cols="md:grid-cols-1"
          items={[
            { t: 'Busca', d: 'Usa los filtros por promoción, especialidad, empresa o ciudad.' },
            { t: 'Revisa el perfil', d: 'Conoce su trayectoria, sus intereses y en qué puede ayudarte.' },
            { t: 'Conecta', d: 'Envía una solicitud de contacto y empieza la conversación.' },
          ]}
        />
      </SplitBlock>

      <Block>
        <SectionHead
          eyebrow="PERFIL PROFESIONAL"
          title="Qué información puede mostrar un perfil"
          text="Cada titulado decide qué comparte y con quién."
        />
        <PhotoCards
          cols="md:grid-cols-2 lg:grid-cols-4"
          items={[
            { Icon: UserCheck, img: '/images/institucional/perfil-datos.jpg', t: 'Datos básicos', d: 'Nombre, promoción, carrera y fotografía.' },
            { Icon: Briefcase, img: '/images/institucional/perfil-trayectoria.jpg', t: 'Trayectoria', d: 'Cargo actual, empresa y experiencia previa.' },
            { Icon: Cpu, img: '/images/institucional/perfil-habilidades.jpg', t: 'Habilidades', d: 'Tecnologías y áreas en las que se especializa.' },
            { Icon: MessageSquare, img: '/images/institucional/perfil-disponibilidad.jpg', t: 'Disponibilidad', d: 'Si ofrece mentoría o está abierto a colaborar.' },
          ]}
        />
      </Block>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/directorio-privacidad.jpg" alt="Privacidad de los perfiles" Icon={ShieldCheck} reverse>
        <SectionHead
          eyebrow="TU PRIVACIDAD"
          title="Tú decides qué se ve"
          text="El directorio está pensado para conectar sin exponer más de lo necesario."
        />
        <IconCards
          cols="md:grid-cols-1"
          items={[
            { Icon: ShieldCheck, t: 'Acceso solo para miembros', d: 'Los perfiles completos se muestran únicamente a personas con sesión iniciada.' },
            { Icon: Eye, t: 'Control de visibilidad', d: 'Elige qué datos de tu perfil aparecen en las búsquedas.' },
            { Icon: Lock, t: 'Contacto con permiso', d: 'Otros miembros te escriben a través de la plataforma, sin ver tus datos privados.' },
          ]}
        />
      </SplitBlock>

      <SplitBlock img="/images/institucional/directorio-faq.jpg" alt="Preguntas sobre el directorio" Icon={Network}>
        <SectionHead eyebrow="PREGUNTAS FRECUENTES" title="Sobre el directorio" />
        <Faq
          items={[
            { q: '¿Cualquier persona puede ver mi perfil?', a: 'No. Los perfiles completos solo se muestran a miembros con sesión iniciada.' },
            { q: '¿Puedo ocultar mis datos de contacto?', a: 'Sí. Desde tu perfil eliges qué información es visible para otros miembros.' },
            { q: '¿Cómo actualizo mi información?', a: 'Entra a tu perfil después de iniciar sesión y edita tus datos cuando quieras.' },
          ]}
        />
      </SplitBlock>

      <LoginCta
        title="Directorio completo para miembros"
        text="Inicia sesión para explorar los perfiles reales y contactar a otros titulados."
      />
    </>
  );
}

/* ---------- CARRERAS ---------- */

const CAREERS = [
  {
    key: 'sistemas',
    name: 'Ingeniería de Sistemas',
    Icon: Database,
    img: '/images/institucional/sistemas.jpg',
    intro: 'Forma profesionales que analizan, diseñan y gestionan sistemas de información para que las organizaciones funcionen mejor.',
    areas: ['Análisis y diseño de sistemas', 'Bases de datos', 'Arquitectura de software', 'Redes e infraestructura', 'Gestión de proyectos TI'],
    work: 'Analista de sistemas, arquitecto de software, administrador de bases de datos, consultor TI, líder de proyectos.',
  },
  {
    key: 'informatica',
    name: 'Ingeniería Informática',
    Icon: Code2,
    img: '/images/institucional/informatica.jpg',
    intro: 'Forma profesionales que construyen software y soluciones tecnológicas, con base sólida en programación y computación.',
    areas: ['Desarrollo de software', 'Algoritmos y estructuras de datos', 'Inteligencia artificial', 'Sistemas operativos', 'Seguridad informática'],
    work: 'Desarrollador de software, ingeniero de datos, especialista en seguridad, ingeniero de machine learning, emprendedor tecnológico.',
  },
];

function CarrerasView() {
  return (
    <>
      <TabHero
        eyebrow="CARRERAS"
        title="Informática y Sistemas en la UMSS"
        text="Dos carreras de la Facultad de Ciencias y Tecnología que forman a los profesionales de tecnología de nuestra región."
      />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {CAREERS.map(({ key, name, Icon, img, intro, areas, work }) => (
          <article key={key} className="bg-[#F5F2EA] rounded-2xl border border-[#C9C1B1] shadow-sm overflow-hidden flex flex-col">
            <TabImage src={img} alt={name} Icon={Icon} className="w-full h-56" />
            <div className="p-8 space-y-5 flex-1">
              <h2 className="text-2xl font-serif font-bold text-slate-900">{name}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{intro}</p>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-2">Áreas que estudia</p>
                <div className="flex flex-wrap gap-2">
                  {areas.map((a) => (
                    <span key={a} className="px-3 py-1 rounded-full bg-[#0F172A] text-white text-xs font-medium">{a}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-2">Campo laboral</p>
                <p className="text-sm text-slate-600 leading-relaxed">{work}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Block bg="bg-[#E7E1D4]">
        <SectionHead
          eyebrow="COMPARA"
          title="En qué se parecen y en qué se diferencian"
          text="Comparación general para orientarte. Ambas comparten una base sólida en computación y matemáticas."
        />
        <TabImage src="/images/institucional/carreras-comparacion.jpg" alt="Sistemas e Informática" Icon={Code2} className="w-full h-56 rounded-2xl shadow-md mb-8" />
        <div className="overflow-x-auto rounded-2xl border border-[#C9C1B1] shadow-sm">
          <table className="w-full text-sm text-left bg-[#F5F2EA]">
            <thead className="bg-[#0F172A] text-white">
              <tr>
                <th className="px-5 py-3 font-semibold"></th>
                <th className="px-5 py-3 font-semibold">Ing. de Sistemas</th>
                <th className="px-5 py-3 font-semibold">Ing. Informática</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6CFC2] text-slate-700">
              {[
                ['Enfoque principal', 'Sistemas de información y su gestión en las organizaciones', 'Desarrollo de software y soluciones computacionales'],
                ['Qué construyes', 'Soluciones que integran procesos, datos y tecnología', 'Aplicaciones, algoritmos y plataformas de software'],
                ['Perfil afín', 'Quien disfruta analizar procesos y coordinar equipos', 'Quien disfruta programar y resolver problemas técnicos'],
                ['Roles frecuentes', 'Analista, arquitecto, consultor TI, líder de proyectos', 'Desarrollador, ingeniero de datos, especialista en seguridad'],
              ].map((row) => (
                <tr key={row[0]}>
                  <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{row[0]}</td>
                  <td className="px-5 py-4 leading-relaxed">{row[1]}</td>
                  <td className="px-5 py-4 leading-relaxed">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block>
        <SectionHead eyebrow="HABILIDADES" title="Lo que desarrollarás en ambas carreras" />
        <PhotoCards
          cols="md:grid-cols-2 lg:grid-cols-4"
          items={[
            { Icon: Terminal, img: '/images/institucional/skill-programacion.jpg', t: 'Programación', d: 'Lógica, lenguajes y construcción de software de calidad.' },
            { Icon: Database, img: '/images/institucional/skill-datos.jpg', t: 'Datos', d: 'Modelado, almacenamiento y análisis de información.' },
            { Icon: Lightbulb, img: '/images/institucional/skill-problemas.jpg', t: 'Resolución de problemas', d: 'Pensamiento analítico para abordar retos complejos.' },
            { Icon: Users, img: '/images/institucional/skill-equipo.jpg', t: 'Trabajo en equipo', d: 'Colaboración, comunicación y gestión de proyectos.' },
          ]}
        />
      </Block>

      <Block bg="bg-[#E7E1D4]">
        <SectionHead eyebrow="TU CAMINO" title="De estudiante a profesional" text="Así te acompaña la red en cada etapa." />
        <TabImage src="/images/institucional/carreras-camino.jpg" alt="De estudiante a profesional" Icon={Rocket} className="w-full h-56 rounded-2xl shadow-md mb-8" />
        <Steps
          cols="md:grid-cols-2 lg:grid-cols-4"
          items={[
            { t: 'Estudias', d: 'Construyes tu base en la Facultad de Ciencias y Tecnología.' },
            { t: 'Te gradúas', d: 'Te unes a la red como titulado de la UMSS.' },
            { t: 'Conectas', d: 'Encuentras mentores, colegas y oportunidades laborales.' },
            { t: 'Devuelves', d: 'Guías a las nuevas generaciones y fortaleces la comunidad.' },
          ]}
        />
      </Block>

      <p className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-8 text-xs text-slate-500">
        Descripción general. Los planes de estudio oficiales los publica la Facultad de Ciencias y Tecnología de la UMSS.
      </p>

      <LoginCta
        title="¿Ya te graduaste de alguna de estas carreras?"
        text="Crea tu cuenta para unirte a la red de titulados y conocer a quienes siguieron tu mismo camino."
      />
    </>
  );
}

/* ---------- EVENTOS ---------- */

function EventosView() {
  return (
    <>
      <TabHero
        eyebrow="EVENTOS"
        title="Eventos disponibles para la comunidad"
        text="Talleres, hackatones y encuentros pensados para aprender, conectar y celebrar con la comunidad de titulados."
      />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        <TabImage src="/images/institucional/eventos.jpg" alt="Eventos de la comunidad UMSS" Icon={Calendar} className="w-full h-60 rounded-2xl shadow-md" />

        <div className="flex flex-col items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="flex-1 text-sm text-slate-700 leading-relaxed">
            Consulta el catálogo actualizado de eventos publicados por la administración. Para inscribirte necesitas iniciar sesión.
          </p>
          <Link
            href="/portal/eventos"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FFB162] px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-[#f39c4a]"
          >
            Ver eventos publicados <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Block bg="bg-[#E7E1D4]">
        <SectionHead eyebrow="TIPOS DE EVENTOS" title="Hay un espacio para cada interés" />
        <PhotoCards
          cols="md:grid-cols-2 lg:grid-cols-4"
          items={[
            { Icon: Terminal, img: '/images/institucional/evento-taller.jpg', t: 'Talleres', d: 'Sesiones prácticas para aprender una herramienta o técnica nueva.' },
            { Icon: Trophy, img: '/images/institucional/evento-hackaton.jpg', t: 'Hackatones', d: 'Retos por equipos para crear soluciones en poco tiempo.' },
            { Icon: Mic, img: '/images/institucional/evento-charla.jpg', t: 'Charlas', d: 'Titulados y especialistas comparten su experiencia profesional.' },
            { Icon: Users, img: '/images/institucional/evento-encuentro.jpg', t: 'Encuentros', d: 'Reuniones para reconectar con tu promoción y ampliar tu red.' },
          ]}
        />
      </Block>

      <SplitBlock img="/images/institucional/eventos-inscripcion.jpg" alt="Inscripción a eventos" Icon={Calendar} reverse>
        <SectionHead eyebrow="INSCRIPCIÓN" title="Cómo inscribirte a un evento" />
        <Steps
          cols="md:grid-cols-1"
          items={[
            { t: 'Elige un evento', d: 'Revisa la fecha, el lugar y la modalidad que más te convenga.' },
            { t: 'Inicia sesión', d: 'Necesitas tu cuenta de la red para reservar tu lugar.' },
            { t: 'Confirma tu asistencia', d: 'Pulsa “Inscribirme” y recibe la confirmación de tu cupo.' },
          ]}
        />
      </SplitBlock>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/eventos-faq.jpg" alt="Preguntas sobre los eventos" Icon={Mic}>
        <SectionHead eyebrow="PREGUNTAS FRECUENTES" title="Sobre los eventos" />
        <Faq
          items={[
            { q: '¿Los eventos tienen costo?', a: 'Depende de cada evento. El costo, si existe, se indica en su descripción.' },
            { q: '¿Puedo cancelar mi inscripción?', a: 'Sí. Desde tu cuenta puedes liberar tu cupo para que otra persona lo aproveche.' },
            { q: '¿Puedo proponer un evento?', a: 'Sí. Los miembros pueden sugerir talleres, charlas o encuentros iniciando sesión.' },
          ]}
        />
      </SplitBlock>

      <LoginCta
        title="Reserva tu lugar"
        text="Inicia sesión para inscribirte a los eventos y recibir avisos de las próximas actividades."
      />
    </>
  );
}

/* ---------- SOBRE NOSOTROS ---------- */

function NosotrosView() {
  return (
    <>
      <TabHero
        eyebrow="SOBRE NOSOTROS"
        title="La red oficial de titulados de la UMSS"
        text="UMSSPIRA nace para que la formación recibida en la Facultad de Ciencias y Tecnología siga generando oportunidades toda la vida."
      />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">NUESTRA HISTORIA</p>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Un legado desde 1832</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            La Universidad Mayor de San Simón, fundada en 1832, ha formado generaciones de profesionales en Cochabamba y Bolivia. UMSSPIRA reúne a los titulados de Ingeniería de Sistemas e Ingeniería Informática en un solo lugar.
          </p>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Nuestra meta es simple: que ningún titulado se sienta solo y que cada promoción sostenga a la siguiente.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative w-56 h-56 rounded-full border-4 border-amber-500/60 bg-[#0F172A] p-10 shadow-xl">
            <Image src={selloImg} alt="Sello institucional UMSS" fill className="object-contain p-10" />
          </div>
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { Icon: Target, t: 'Misión', d: 'Conectar a los titulados con oportunidades, conocimiento y entre sí, fortaleciendo su vínculo con la universidad.' },
          { Icon: Eye, t: 'Visión', d: 'Ser la comunidad de referencia de profesionales de tecnología formados en la UMSS.' },
          { Icon: Globe, t: 'Valores', d: 'Colaboración, ciencia, conocimiento y compromiso con la sociedad.' },
        ].map(({ Icon, t, d }) => (
          <div key={t} className="bg-[#F5F2EA] p-8 rounded-2xl border border-[#C9C1B1] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
            <h3 className="text-xl font-serif font-bold text-slate-900">{t}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{d}</p>
          </div>
        ))}
      </section>

      <section className="bg-[#0F172A] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { Icon: Building2, n: '194', l: 'AÑOS DE TRAYECTORIA' },
            { Icon: Users, n: '28', l: 'PROMOCIONES' },
            { Icon: GraduationCap, n: '+4,200', l: 'TITULADOS' },
            { Icon: BookOpen, n: '2', l: 'CARRERAS' },
          ].map(({ Icon, n, l }) => (
            <div key={l} className="space-y-1">
              <div className="flex justify-center text-amber-500 mb-2"><Icon className="w-6 h-6" /></div>
              <h3 className="text-3xl font-serif font-bold text-amber-400">{n}</h3>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <Block>
        <SectionHead
          center
          eyebrow="NUESTRO LEMA"
          title="Ciencia, Conocimiento, Sociedad"
          text="Los tres pilares que guían a la universidad y a esta red de titulados."
        />
        <PhotoCards
          items={[
            { Icon: Lightbulb, img: '/images/institucional/lema-ciencia.jpg', t: 'Ciencia', d: 'Impulsamos el pensamiento riguroso y la innovación tecnológica.' },
            { Icon: BookOpen, img: '/images/institucional/lema-conocimiento.jpg', t: 'Conocimiento', d: 'Compartimos lo aprendido para que cada generación llegue más lejos.' },
            { Icon: Heart, img: '/images/institucional/lema-sociedad.jpg', t: 'Sociedad', d: 'Ponemos nuestra profesión al servicio de la comunidad y del país.' },
          ]}
        />
      </Block>

      <SplitBlock img="/images/institucional/nosotros-unirse.jpg" alt="Únete a la red de titulados" Icon={UserCheck}>
        <SectionHead
          eyebrow="SÉ PARTE"
          title="Cómo unirte a la red"
          text="Pueden unirse los titulados de Ingeniería de Sistemas e Ingeniería Informática de la UMSS."
        />
        <Steps
          cols="md:grid-cols-1"
          items={[
            { t: 'Solicita tu acceso', d: 'Completa el registro con tus datos de titulado.' },
            { t: 'Valida tu perfil', d: 'Confirmamos tu pertenencia a la comunidad.' },
            { t: 'Participa', d: 'Usa el directorio, el foro, la mentoría y los eventos.' },
          ]}
        />
      </SplitBlock>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/nosotros-faq.jpg" alt="Preguntas sobre UMSSPIRA" Icon={Building2} reverse>
        <SectionHead eyebrow="PREGUNTAS FRECUENTES" title="Sobre UMSSPIRA" />
        <Faq
          items={[
            { q: '¿UMSSPIRA es un servicio oficial de la universidad?', a: 'Es la red de titulados de la Facultad de Ciencias y Tecnología de la UMSS para las carreras de Sistemas e Informática.' },
            { q: '¿Quién administra la plataforma?', a: 'La administración está a cargo del equipo responsable de la red de titulados de la facultad.' },
            { q: '¿Cómo puedo colaborar?', a: 'Puedes ser mentor, publicar oportunidades laborales o proponer eventos una vez que tengas tu cuenta.' },
          ]}
        />
      </SplitBlock>

      <LoginCta
        title="Sé parte de la red"
        text="Crea tu cuenta o inicia sesión para empezar a conectar con tu comunidad."
      />
    </>
  );
}

/* ---------- BOLSA DE TRABAJO ---------- */

export function EmpleosView() {
  return (
    <>
      <TabHero
        eyebrow="BOLSA DE TRABAJO"
        title="Oportunidades laborales para titulados de tu facultad"
        text="Empresas y titulados de Sistemas e Informática de la UMSS publican vacantes para que el talento de la red encuentre su siguiente paso."
      />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <TabImage src="/images/institucional/empleos.jpg" alt="Bolsa de trabajo de titulados UMSS" Icon={Briefcase} className="w-full h-72 rounded-2xl shadow-md order-last lg:order-first" />
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">PARA QUÉ SIRVE</p>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Un empleo puede empezar con una recomendación</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Encuentra ofertas publicadas por empresas y por otros titulados, filtradas por área, modalidad y ciudad. Postula con tu perfil profesional y llega directo a quien está buscando talento de la UMSS.
          </p>
        </div>
      </section>

      <section className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6">Podrás buscar por</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { Icon: Cpu, t: 'Área profesional' },
            { Icon: Clock, t: 'Modalidad' },
            { Icon: Building2, t: 'Empresa' },
            { Icon: MapPin, t: 'Ciudad o país' },
          ].map(({ Icon, t }) => (
            <div key={t} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
              <p className="text-sm font-bold text-slate-900">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-1">Así se ve una oferta</h3>
        <p className="text-xs text-slate-500 mb-6">Ofertas de ejemplo, no corresponden a vacantes reales.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { t: 'Desarrollador Backend', e: 'Empresa de ejemplo', m: 'Remoto · Tiempo completo' },
            { t: 'Analista de Datos', e: 'Empresa de ejemplo', m: 'Híbrido · Cochabamba' },
            { t: 'Soporte y Redes', e: 'Empresa de ejemplo', m: 'Presencial · Medio tiempo' },
          ].map((x) => (
            <div key={x.t} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center shrink-0"><Briefcase className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">{x.t}</p>
                <p className="text-xs text-slate-500">{x.e}</p>
                <p className="text-xs text-slate-500">{x.m}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/empleos-proceso.jpg" alt="Cómo postular" Icon={Search}>
        <SectionHead eyebrow="CÓMO FUNCIONA" title="Postula en 3 pasos" />
        <Steps
          cols="md:grid-cols-1"
          items={[
            { t: 'Explora las ofertas', d: 'Filtra por área, modalidad, empresa o ciudad.' },
            { t: 'Completa tu perfil', d: 'Un perfil al día aumenta tus posibilidades de ser contactado.' },
            { t: 'Postula', d: 'Envía tu postulación desde la plataforma y sigue su estado.' },
          ]}
        />
      </SplitBlock>

      <Block>
        <SectionHead
          eyebrow="PARA EMPRESAS Y TITULADOS"
          title="También puedes publicar"
          text="La bolsa de trabajo funciona en las dos direcciones."
        />
        <IconCards
          items={[
            { Icon: Building2, t: 'Empresas', d: 'Publica una vacante y llega a titulados verificados de Sistemas e Informática.' },
            { Icon: UserCheck, t: 'Titulados', d: 'Comparte una oportunidad con tu red cuando conozcas una vacante.' },
            { Icon: ShieldCheck, t: 'Cuentas verificadas', d: 'Solo miembros con sesión iniciada publican y postulan.' },
          ]}
        />
      </Block>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/empleos-faq.jpg" alt="Preguntas sobre la bolsa de trabajo" Icon={Briefcase} reverse>
        <SectionHead eyebrow="PREGUNTAS FRECUENTES" title="Sobre la bolsa de trabajo" />
        <Faq
          items={[
            { q: '¿Necesito una cuenta para ver las ofertas?', a: 'Para postular y publicar necesitas iniciar sesión.' },
            { q: '¿Tiene algún costo postular?', a: 'No. Postular es gratuito para los titulados de la red.' },
            { q: '¿Puedo publicar una vacante?', a: 'Sí. Las empresas y los titulados pueden publicar vacantes con su cuenta.' },
          ]}
        />
      </SplitBlock>

      <LoginCta
        title="Bolsa de trabajo para miembros"
        text="Inicia sesión para ver todas las vacantes, postular o publicar una oferta."
      />
    </>
  );
}

/* ---------- MENTORÍAS ---------- */

export function MentoriasView() {
  return (
    <>
      <TabHero
        eyebrow="MENTORÍAS"
        title="Aprende de quienes ya recorrieron el camino"
        text="La red de mentorías conecta a titulados de Sistemas e Informática de la UMSS con quienes quieren orientación para su carrera."
      />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <TabImage src="/images/institucional/mentorias.jpg" alt="Red de mentorías UMSS" Icon={Users} className="w-full h-72 rounded-2xl shadow-md order-last lg:order-first" />
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold">PARA QUÉ SIRVE</p>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Una guía a tiempo puede acortar tu camino</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Encuentra un mentor por área técnica o interés, o ofrece tu experiencia a quienes recién empiezan. Cada mentoría fortalece a toda la red.
          </p>
        </div>
      </section>

      <section className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6">Podrás buscar mentores por</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { Icon: Cpu, t: 'Área técnica' },
            { Icon: Lightbulb, t: 'Intereses de mentoría' },
            { Icon: Clock, t: 'Disponibilidad' },
            { Icon: GraduationCap, t: 'Experiencia' },
          ].map(({ Icon, t }) => (
            <div key={t} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
              <p className="text-sm font-bold text-slate-900">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-1">Así se ve un perfil de mentor</h3>
        <p className="text-xs text-slate-500 mb-6">Perfiles de ejemplo, no corresponden a personas reales.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { i: 'AB', r: 'Backend Developer', p: 'Mentoría en arquitectura y APIs' },
            { i: 'CD', r: 'Analista de Datos', p: 'Mentoría en análisis y entrevistas técnicas' },
            { i: 'EF', r: 'Arquitecta de Software', p: 'Mentoría en liderazgo técnico' },
          ].map((x) => (
            <div key={x.i} className="bg-[#F5F2EA] p-6 rounded-2xl border border-[#C9C1B1] shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0F172A] text-amber-400 flex items-center justify-center font-bold shrink-0">{x.i}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{x.r}</p>
                <p className="text-xs text-slate-500">{x.p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/mentorias-proceso.jpg" alt="Cómo funciona la mentoría" Icon={Users} reverse>
        <SectionHead eyebrow="CÓMO FUNCIONA" title="Encuentra a tu mentor en 3 pasos" />
        <Steps
          cols="md:grid-cols-1"
          items={[
            { t: 'Crea tu perfil', d: 'Cuéntanos qué te gustaría aprender o enseñar.' },
            { t: 'Busca y solicita', d: 'Elige un mentor por área o interés y envía tu solicitud.' },
            { t: 'Avancen juntos', d: 'Acuerden objetivos y encuentros para tu crecimiento profesional.' },
          ]}
        />
      </SplitBlock>

      <Block>
        <SectionHead
          eyebrow="QUIERO SER MENTOR"
          title="Todo titulado tiene algo que compartir"
          text="No importa el año de tu promoción: tú decides en qué ayudar y cuándo."
        />
        <IconCards
          items={[
            { Icon: Target, t: 'Define tus áreas', d: 'Elige las áreas técnicas en las que puedes orientar.' },
            { Icon: Clock, t: 'Fija tu disponibilidad', d: 'Indica cuándo puedes atender a quienes te soliciten.' },
            { Icon: Heart, t: 'Devuelve lo recibido', d: 'Guía a las nuevas generaciones y fortalece la comunidad.' },
          ]}
        />
      </Block>

      <SplitBlock bg="bg-[#E7E1D4]" img="/images/institucional/mentorias-faq.jpg" alt="Preguntas sobre las mentorías" Icon={MessageSquare}>
        <SectionHead eyebrow="PREGUNTAS FRECUENTES" title="Sobre las mentorías" />
        <Faq
          items={[
            { q: '¿Necesito una cuenta para pedir una mentoría?', a: 'Sí. Para solicitar o ofrecer una mentoría necesitas iniciar sesión.' },
            { q: '¿Tiene algún costo?', a: 'No. La mentoría entre miembros de la red es gratuita.' },
            { q: '¿Puedo ser mentor si me gradué hace poco?', a: 'Sí. Todo titulado tiene experiencia que compartir, sin importar su promoción.' },
          ]}
        />
      </SplitBlock>

      <LoginCta
        title="Mentorías para miembros"
        text="Inicia sesión para buscar un mentor, enviar una solicitud o ofrecer tu experiencia."
      />
    </>
  );
}

/* ---------- Selector de vista ---------- */

function InstitucionalContent() {
  const tab = useSearchParams().get('tab');
  let view: React.ReactNode;
  switch (tab) {
    case 'comunidad': view = <ComunidadView />; break;
    case 'directorio': view = <DirectorioView />; break;
    case 'carreras': view = <CarrerasView />; break;
    case 'eventos': view = <EventosView />; break;
    case 'nosotros': view = <NosotrosView />; break;
    case 'empleos': view = <EmpleosView />; break;
    case 'mentorias': view = <MentoriasView />; break;
    default: view = <HomeView />;
  }
  return <div className="bg-[#EEE9DF]">{view}</div>;
}

export default function InstitucionalViews() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEE9DF]" />}>
      <InstitucionalContent />
    </Suspense>
  );
}




