'use client';

import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { cn } from '@/shared/utils/cn';

export interface OtpInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value = ['', '', '', '', '', ''],
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = true,
  className,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digit = rawValue.replace(/\D/g, '').slice(-1);

    const newDigits = [...value];
    newDigits[index] = digit;
    onChange(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        e.preventDefault();
        const newDigits = [...value];
        newDigits[index - 1] = '';
        onChange(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else if (value[index]) {
        e.preventDefault();
        const newDigits = [...value];
        newDigits[index] = '';
        onChange(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...value];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    onChange(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
      {Array.from({ length: 6 }).map((_, index) => {
        const digitValue = value[index] || '';
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digitValue}
            disabled={disabled}
            aria-label={`Dígito ${index + 1} de 6`}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              'h-12 w-11 sm:h-14 sm:w-12 rounded-lg text-center text-xl font-bold font-mono transition-all outline-none',
              'bg-palladian text-abyssal',
              'border focus:border-2 focus:border-blue-fantastic focus:bg-white',
              hasError
                ? 'border-2 border-truffle-trouble bg-palladian text-truffle-trouble'
                : 'border-oatmeal',
              disabled && 'opacity-50 cursor-not-allowed bg-oatmeal/20'
            )}
          />
        );
      })}
    </div>
  );
};
