import { Button } from '@/shared/components/button';

export interface StepNoticeProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

// Aviso que reemplaza el formulario cuando el titulado no puede continuar en este paso.
export function StepNotice({ message, actionLabel, onAction }: StepNoticeProps) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl border border-oatmeal bg-white p-6 shadow-sm sm:p-8">
      <p role="alert" className="text-sm font-medium text-abyssal-blue">
        {message}
      </p>
      <Button type="button" onClick={onAction}>
        {actionLabel}
      </Button>
    </section>
  );
}
