'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[13px] font-semibold text-abyssal-blue">
          {label}
          <span className="text-truffle-trouble"> *</span>
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isVisible ? 'text' : 'password'}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-11 w-full rounded-lg bg-palladian pl-3 pr-11 text-sm text-abyssal-blue outline-none transition-colors placeholder:text-blue-fantastic/50',
              'border focus:border-2 focus:border-blue-fantastic focus:bg-white',
              error ? 'border-2 border-truffle-trouble' : 'border-oatmeal',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setIsVisible((current) => !current)}
            aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-blue-fantastic hover:text-abyssal-blue"
          >
            {isVisible ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} className="text-[11px] font-medium text-truffle-trouble">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';