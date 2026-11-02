import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { PASSWORD_RULES } from '../validation/password-rules';

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="space-y-1.5" aria-label="Requisitos de la contraseña">
      {PASSWORD_RULES.map((rule) => {
        const isMet = rule.test(password);
        return (
          <li
            key={rule.id}
            data-met={isMet}
            className={cn(
              'flex items-center gap-2 text-xs font-medium',
              isMet ? 'text-green-700' : 'text-blue-fantastic/70',
            )}
          >
            {isMet ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{rule.label}</span>
            <span className="sr-only">{isMet ? '(cumplido)' : '(pendiente)'}</span>
          </li>
        );
      })}
    </ul>
  );
}