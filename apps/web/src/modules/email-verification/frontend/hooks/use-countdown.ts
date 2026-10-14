'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseCountdownOptions {
  initialSeconds?: number;
  autoStart?: boolean;
  onExpire?: () => void;
}

export interface UseCountdownReturn {
  secondsLeft: number;
  isExpired: boolean;
  isRunning: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  reset: (newSeconds?: number) => void;
}

/**
 * Hook para temporizador regresivo en segundos.
 * Diseñado para tiempos de expiración OTP (5 min) y cooldowns de reenvío (30 seg).
 */
export function useCountdown({
  initialSeconds = 300,
  autoStart = true,
  onExpire,
}: UseCountdownOptions = {}): UseCountdownReturn {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(
    (newSeconds?: number) => {
      setSecondsLeft(newSeconds !== undefined ? newSeconds : initialSeconds);
      setIsRunning(autoStart);
    },
    [initialSeconds, autoStart]
  );

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      if (secondsLeft === 0 && isRunning) {
        setIsRunning(false);
        onExpireRef.current?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0,
    isRunning,
    formattedTime,
    start,
    pause,
    reset,
  };
}
