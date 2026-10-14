import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export type ProgressStepKey = 'data' | 'email' | 'document';

const STEPS: { key: ProgressStepKey; label: string }[] = [
  { key: 'data', label: 'Datos' },
  { key: 'email', label: 'Verificación de correo' },
  { key: 'document', label: 'Documento' },
];

export interface ProgressStepsProps {
  currentStep: ProgressStepKey;
  className?: string;
}

/**
 * Indicador horizontal de progreso del registro publico (CA-01.2).
 * Muestra las etapas por su nombre, sin numeros de paso, y resalta la etapa actual.
 */
export function ProgressSteps({ currentStep, className }: ProgressStepsProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <nav
      aria-label="Progreso del registro"
      className={cn('mb-8 rounded-2xl border border-oatmeal bg-palladian/60 px-5 py-4 sm:px-8 sm:py-6', className)}
    >
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <li key={step.key} aria-current={isCurrent ? 'step' : undefined} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  isCompleted && 'bg-blue-fantastic text-white',
                  isCurrent && 'bg-burning-flame',
                  !isCompleted && !isCurrent && 'border-2 border-oatmeal bg-white',
                )}
              >
                {isCompleted && <Check className="h-5 w-5" strokeWidth={3} />}
                {isCurrent && <span className="h-3 w-3 rounded-full bg-abyssal-blue" />}
              </span>
              <span className="flex flex-col">
                <span
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wider',
                    isCurrent ? 'text-truffle-trouble' : 'text-abyssal-blue/60',
                  )}
                >
                  {isCompleted ? 'Completado' : isCurrent ? 'En curso' : 'Pendiente'}
                </span>
                <span className={cn('text-sm', isCurrent || isCompleted ? 'font-semibold text-abyssal-blue' : 'text-abyssal-blue/70')}>
                  {step.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
