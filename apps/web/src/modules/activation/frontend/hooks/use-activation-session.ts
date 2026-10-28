'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { activationService, ActivationError, type ActivationStatus } from '../services/activation.service';

export interface UseActivationOptions {
  applicationId: string;
  email?: string;
  onSuccess?: (activationToken: string, maskedEmail: string) => void;
}

export function formatCooldownTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const parts = [Math.floor(safe / 3600), Math.floor((safe % 3600) / 60), safe % 60];
  return (safe >= 3600 ? parts : parts.slice(1)).map((part) => String(part).padStart(2, '0')).join(':');
}

export function useActivation({ applicationId, onSuccess }: UseActivationOptions) {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [status, setStatus] = useState<ActivationStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [activationToken, setActivationToken] = useState<string | null>(null);
  const busy = useRef(false);
  const cooldownSeconds = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));
  const failedAttempts = status?.failedAttempts ?? 0;
  const isOtpInvalidated = failedAttempts >= 5;
  const fullCode = otpDigits.join('');
  const isCodeComplete = /^\d{6}$/.test(fullCode);

  const applyStatus = useCallback((next: ActivationStatus) => {
    setStatus(next);
    setNow(Date.now());
    setCooldownEnd(Date.now() + next.cooldownSeconds * 1000);
  }, []);
  const refresh = useCallback(async () => {
    const next = await activationService.inspect(applicationId);
    applyStatus(next);
  }, [applicationId, applyStatus]);

  useEffect(() => {
    let active = true;
    setStatus(null);
    void activationService.inspect(applicationId).then((next) => {
      if (active) applyStatus(next);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudo consultar la activación');
    });
    return () => { active = false; };
  }, [applicationId, applyStatus]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const verifyCode = async () => {
    if (!status || !isCodeComplete || busy.current || isOtpInvalidated) return;
    busy.current = true;
    setIsVerifying(true);
    setError(null);
    try {
      const result = await activationService.verifyOtp(applicationId, fullCode);
      setActivationToken(result.activationToken);
      onSuccess?.(result.activationToken, status.maskedEmail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo verificar el código');
      if (cause instanceof ActivationError && cause.code === 'ACTIVATION_ATTEMPTS_EXCEEDED') {
        setStatus((current) => current ? { ...current, failedAttempts: 5 } : current);
      }
      await refresh().catch(() => undefined);
    } finally { busy.current = false; setIsVerifying(false); }
  };
  const resendCode = async () => {
    if (!status || cooldownSeconds > 0 || busy.current) return;
    busy.current = true;
    setIsResending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await activationService.resendOtp(applicationId);
      applyStatus({ ...status, failedAttempts: 0, cooldownSeconds: result.cooldownSeconds ?? 0,
        resendCount: result.resendCount ?? status.resendCount, expiresAt: result.expiresAt ?? status.expiresAt });
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage('Se solicitó el envío de un nuevo código a tu correo.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo reenviar el código');
      await refresh().catch(() => undefined);
    } finally { busy.current = false; setIsResending(false); }
  };

  return {
    otpDigits, fullCode, isCodeComplete, maskedEmail: status?.maskedEmail ?? 'Consultando correo…',
    isVerifying, isResending, isLocked: !status || cooldownSeconds > 0, isLoading: !status,
    error, successMessage, failedAttempts, isOtpInvalidated, resendCount: status?.resendCount ?? 0,
    cooldownSeconds, cooldownFormatted: formatCooldownTime(cooldownSeconds), activationToken,
    expiresAt: status?.expiresAt,
    handleDigitChange: (index: number, digit: string) => {
      setOtpDigits((current) => current.map((value, position) => position === index ? digit : value));
      setError(null);
    },
    handleFullOtp: (digits: string[]) => { setOtpDigits(digits.slice(0, 6)); setError(null); },
    verifyCode, resendCode,
  };
}
