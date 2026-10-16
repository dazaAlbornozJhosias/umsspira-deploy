import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export type ProgressStepKey = 'data' | 'email' | 'document';

const STEPS: { key: ProgressStepKey; label: string }[] = [
  { key: 'data', label: 'Datos Personales' },
  { key: 'email', label: 'Verificación de Correo' },
  { key: 'document', label: 'Carga de Requisitos' },
];

export interface ProgressStepsProps {
  currentStep: ProgressStepKey;
  className?: string;
}

/**
 * Indicador horizontal de progreso del registro publico (CA-01.2).
 * Muestra las tres etapas con su estado: completada (visto), en curso (numero)
 * o pendiente (numero), resaltando la etapa actual.
 */
export function ProgressSteps({ currentStep, className }: ProgressStepsProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <nav
      aria-label="Progreso del registro"
      className={cn('mb-8 rounded-2xl border border-oatmeal bg-palladian/60 px-5 py-4 sm:px-8 sm:py-5', className)}
    >
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-2">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = index < currentIndex;
          const stepNumber = index + 1;

          return (
            <li key={step.key} aria-current={isCurrent ? 'step' : undefined} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  isCompleted && 'bg-abyssal-blue text-white',
                  isCurrent && 'bg-burning-flame text-abyssal-blue',
                  !isCompleted && !isCurrent && 'border-2 border-oatmeal bg-white text-abyssal-blue',
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : isCurrent ? (
                  stepNumber
                ) : (
                  String(stepNumber).padStart(2, '0')
                )}
              </span>
              <span className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-abyssal-blue/60">
                  Paso {stepNumber}
                  {isCurrent && <span className="text-truffle-trouble"> • En curso</span>}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    isCurrent || isCompleted ? 'font-semibold text-abyssal-blue' : 'text-abyssal-blue/70',
                  )}
                >
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
