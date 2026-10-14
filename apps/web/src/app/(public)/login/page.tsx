import Image from "next/image";
import type { ReactNode } from "react";
import { LoginForm } from "../../../modules/auth/frontend/components/login-form";

const PANEL_IMAGE = "/images/login-panel.jpg";

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
const ServerIcon = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <path d="M7 7h.01M7 17h.01" />
  </Svg>
);

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel institucional */}
      <aside className="relative hidden overflow-hidden lg:flex">
        <Image
          src={PANEL_IMAGE}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-right"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-abyssal-blue via-abyssal-blue/30 to-abyssal-blue/20"
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-8 text-white">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-abyssal-blue/70 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-burning-flame" />
              UMSS • FCYT
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-abyssal-blue/70 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
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
                  <ServerIcon />
                </span>
                Servidores DTI UMSS
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Columna del formulario */}
      <section className="flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[450px] space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div className="leading-none">
              <p className="text-[22px] font-bold tracking-tight text-abyssal-blue">UMSSPIRA</p>
              <p className="mt-1 text-[10px] font-bold text-abyssal-blue">UMSS</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-oatmeal/70 bg-white/60 px-3 py-1 text-xs text-abyssal-blue/80">
              <span className="text-emerald-600">
                <CheckCircleIcon />
              </span>
              Portal Seguro
            </span>
          </header>

          <div className="rounded-2xl border border-oatmeal/70 bg-[#F5F2EA] p-8 shadow-xl shadow-abyssal-blue/10">
            <h1 className="text-3xl font-bold tracking-tight text-abyssal-blue">Iniciar Sesión</h1>
            <p className="mt-2 text-sm text-abyssal-blue/70">
              Ingresa a la plataforma institucional con tu cuenta universitaria
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>

          <footer className="space-y-1 text-center text-[11px] text-abyssal-blue/60">
            <p className="uppercase tracking-wider">Universidad Mayor de San Simón • DTI &amp; DPA</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
