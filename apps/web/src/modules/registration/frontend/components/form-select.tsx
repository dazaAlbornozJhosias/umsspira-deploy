import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/shared/utils/cn';

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  placeholder: string;
  options: { value: string; label: string }[];
}

/**
 * Lista desplegable con los mismos estados visuales que el Input del sistema de diseno
 * (reposo, foco y error en Truffle Trouble).
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, label, required, error, placeholder, options, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? props.name ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-[13px] font-semibold text-abyssal-blue">
          {label}
          {required && <span className="text-truffle-trouble"> *</span>}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-11 rounded-lg bg-palladian px-3 text-sm text-abyssal-blue outline-none transition-colors',
            'border focus:border-2 focus:border-blue-fantastic focus:bg-white disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-2 border-truffle-trouble' : 'border-oatmeal',
            className,
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-[11px] font-medium text-truffle-trouble">
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormSelect.displayName = 'FormSelect';
