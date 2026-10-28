import Image from "next/image";
import type { ReactNode } from "react";
import { LoginForm } from "../../../modules/auth/frontend/components/login-form";

const PANEL_IMAGE = "/images/login-panel.jpg";
const UMSS_LOGO = "/images/logo-umss.png";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const CheckCircleIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </Svg>
);
const LockSmallIcon = () => (
  <Svg>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);
const CloudIcon = () => (
  <Svg>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </Svg>
);

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel institucional */}
      <aside className="relative hidden overflow-hidden lg:flex">
        <Image
          src={PANEL_IMAGE}
          alt="Campus de la Universidad Mayor de San Simón"
          fill
          priority
          sizes="50vw"
          className="object-cover object-right"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-abyssal-blue via-abyssal-blue/40 to-abyssal-blue/20"
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 text-white">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-abyssal-blue/70 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-burning-flame" />
              UMSS • FCYT
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-abyssal-blue/70 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              <CheckCircleIcon />
              Acreditación Oficial
            </span>
          </div>

          <div className="max-w-xl space-y-4">
            <div className="h-0.5 w-12 bg-burning-flame" />
            <p className="font-display text-xl font-normal italic leading-snug">
              “Conectando el talento de San Simón con el futuro tecnológico y profesional de
              Bolivia.”
            </p>
            <p className="text-sm leading-relaxed text-white/80">
              Facultad de Ciencias y Tecnología • Carrera de Ingeniería de Sistemas. Red alumni
              integrada para seguimiento curricular, convenios y validación digital.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-burning-flame">
                  <LockSmallIcon />
                </span>
                Cifrado SSL 256-bit
              </span>
              <span aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-emerald-400">
                  <CloudIcon />
                </span>
                Servidores DTI UMSS
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Columna del formulario */}
      <section className="flex flex-col items-center justify-center bg-[#EEE9DF] px-6 py-10 sm:px-10">
        <div className="w-full max-w-[460px] space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src={UMSS_LOGO}
                alt="Escudo oficial de la Universidad Mayor de San Simón"
                width={36}
                height={54}
                className="h-12 w-auto object-contain"
                priority
              />
              <div className="leading-tight">
                <p className="text-[22px] font-black tracking-tight text-abyssal-blue">
                  UMSS<span className="text-burning-flame">PIRA</span>
                </p>
                <p className="text-[11px] font-bold tracking-wider text-abyssal-blue/70">UMSS</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-oatmeal/80 bg-white/80 px-3.5 py-1 text-xs font-medium text-abyssal-blue/80 shadow-sm backdrop-blur">
              <span className="text-emerald-600">
                <CheckCircleIcon />
              </span>
              Portal Seguro
            </span>
          </header>

          {/* Tarjeta con fondo BLANCO puro según FIX-04 */}
          <div className="rounded-2xl border border-oatmeal/60 bg-white p-8 shadow-xl shadow-abyssal-blue/5 sm:p-10">
            <h1 className="font-display text-3xl font-bold tracking-tight text-abyssal-blue">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-abyssal-blue/70">
              Accede al portal oficial de titulados y red profesional de Ingeniería de Sistemas e Ingeniería Informática.
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>

          <footer className="space-y-1 text-center text-[11px] text-abyssal-blue/60">
            <p className="uppercase tracking-wider">
              UNIVERSIDAD MAYOR DE SAN SIMÓN
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
