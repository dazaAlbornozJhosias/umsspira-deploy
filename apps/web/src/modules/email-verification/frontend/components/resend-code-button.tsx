'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/shared/utils/cn';

export interface ResendCodeButtonProps {
  onResend: () => Promise<boolean | void>;
  cooldownSeconds?: number;
  disabled?: boolean;
  isResending?: boolean;
  className?: string;
}

/**
 * Botón para reenviar código OTP con temporizador de cooldown de 30 segundos (CA-02.6).
 */
export const ResendCodeButton: React.FC<ResendCodeButtonProps> = ({
  onResend,
  cooldownSeconds = 0,
  disabled = false,
  isResending = false,
  className,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(cooldownSeconds);

  useEffect(() => {
    setSecondsRemaining(cooldownSeconds);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleClick = async () => {
    if (disabled || isResending || secondsRemaining > 0) return;
    await onResend();
    setSecondsRemaining(30);
  };

  const isLocked = disabled || isResending || secondsRemaining > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLocked}
      className={cn(
        'text-xs font-semibold transition-colors outline-none py-1.5 px-3 rounded-md',
        isLocked
          ? 'text-abyssal/50 bg-oatmeal/20 cursor-not-allowed'
          : 'text-blue-fantastic hover:text-abyssal-blue hover:bg-palladian cursor-pointer underline-offset-4 hover:underline',
        className
      )}
    >
      {isResending ? (
        'Reenviando código...'
      ) : secondsRemaining > 0 ? (
        `Reenviar código (disponible en ${secondsRemaining}s)`
      ) : (
        'Reenviar código de verificación'
      )}
    </button>
  );
};
