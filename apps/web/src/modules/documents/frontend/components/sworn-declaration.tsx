import { ShieldAlert } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export const SWORN_DECLARATION_ERROR = 'Debes aceptar la declaración jurada para enviar tu solicitud.';

export interface SwornDeclarationProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  disabled?: boolean;
}

// Declaracion jurada de autenticidad del documento y aviso de consecuencias legales.
export function SwornDeclaration({ checked, onChange, error, disabled }: SwornDeclarationProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="declaracion-jurada"
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 sm:p-5',
            error ? 'border-2 border-truffle-trouble' : 'border-oatmeal',
          )}
        >
          <input
            id="declaracion-jurada"
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-blue-fantastic"
          />
          <span className="text-sm text-abyssal-blue sm:text-[15px]">
            Declaro bajo juramento que el documento adjunto es copia fiel del original y asumo la responsabilidad
            legal de su autenticidad ante la universidad.<span className="text-truffle-trouble"> *</span>
          </span>
        </label>
        {error && (
          <p role="alert" className="mt-1.5 text-[11px] font-medium text-truffle-trouble">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-r-xl border border-l-4 border-oatmeal border-l-oatmeal bg-white p-4 text-xs text-abyssal-blue/80 sm:text-[13px]">
        <ShieldAlert aria-hidden="true" className="h-5 w-5 shrink-0 text-abyssal-blue" />
        <p>
          La falsedad u omisión en la documentación presentada anulará automáticamente el registro, conforme al
          Reglamento General de Régimen Académico y Títulos Universitarios.
        </p>
      </div>
    </div>
  );
}
