import { ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Pencil } from 'lucide-react';

export interface ReviewSectionProps {
  icon: LucideIcon;
  title: string;
  actionLabel: string;
  actionIcon?: LucideIcon;
  onAction: () => void;
  showAction?: boolean;
  children: ReactNode;
}

/** Bloque del resumen de la solicitud con su accion de edicion (CA-07.2). */
export function ReviewSection({
  icon: Icon,
  title,
  actionLabel,
  actionIcon: ActionIcon = Pencil,
  onAction,
  showAction = true,
  children,
}: ReviewSectionProps) {
  return (
    <section className="rounded-xl border border-oatmeal/70 bg-[#F5F1E8] p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-abyssal-blue">
          <Icon aria-hidden="true" className="h-5 w-5 text-blue-fantastic" />
          {title}
        </h2>
        {showAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 rounded-lg border border-oatmeal bg-white px-3 py-2 text-xs font-semibold text-abyssal-blue transition hover:bg-palladian"
          >
            <ActionIcon aria-hidden="true" className="h-3.5 w-3.5" />
            {actionLabel}
          </button>
        )}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export interface ReviewFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Dato del resumen: etiqueta en mayusculas y valor legible (CA-07.2). */
export function ReviewField({ label, children, className = '' }: ReviewFieldProps) {
  return (
    <div className={`rounded-lg border border-oatmeal/60 bg-white px-3 py-2 ${className}`}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-blue-fantastic/80">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-abyssal-blue">{children}</dd>
    </div>
  );
}

export function ReviewHeader() {
  return (
        <header>
          <h1 className="inline-flex items-center gap-2 rounded-full bg-abyssal-blue px-3 py-1 text-[22px] font-semibold leading-7 text-palladian sm:text-2xl">
            <ClipboardList aria-hidden="true" className="h-6 w-6 shrink-0 text-burning-flame" />
            Revisión de solicitud
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-abyssal-blue/80 sm:text-base">
            Verifica con atención tus datos antes de entregar formalmente la solicitud a la Dirección de Grados Académicos.
          </p>
        </header>
  );
}

export function ReviewDeclaration() {
  return (
          <div className="rounded-xl border border-oatmeal/70 bg-palladian/40 p-4">
            <p className="text-sm font-semibold text-abyssal-blue">Declaración de veracidad y conformidad de antecedentes</p>
            <p className="mt-1 text-xs leading-relaxed text-abyssal-blue/80">
              Declaro bajo juramento que toda la información consignada y el documento adjunto son fidedignos y asumo
              la responsabilidad legal de su autenticidad ante la Universidad Mayor de San Simón.
            </p>
          </div>
  );
}
