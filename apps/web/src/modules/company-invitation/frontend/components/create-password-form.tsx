'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import type { ActivateCompanyInvitationPayload } from '@umsspira/shared-types';
import { Button } from '@/shared/components/button';
import { validatePasswordForm, type PasswordFormErrors } from '../validation/password-rules';
import { PasswordInput } from './password-input';
import { PasswordRequirements } from './password-requirements';

interface CreatePasswordFormProps {
  onSubmit: (payload: ActivateCompanyInvitationPayload) => Promise<string | null>;
}

export function CreatePasswordForm({ onSubmit }: CreatePasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validatePasswordForm(password, confirmPassword);
    setErrors(validationErrors);
    setSubmitError(null);
    if (validationErrors.password || validationErrors.confirmPassword) return;

    setIsSubmitting(true);
    const message = await onSubmit({ password, confirmPassword });
    setIsSubmitting(false);
    if (message) setSubmitError(message);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-5 flex h-16 w-16 items-center justify-center self-center rounded-full bg-burning-flame/20">
        <Lock className="h-8 w-8 text-truffle-trouble" aria-hidden="true" />
      </div>
      <h1 className="text-center text-[22px] font-bold leading-[30px] text-abyssal-blue sm:text-[32px] sm:leading-10">
        Crear contraseña
      </h1>
      <p className="mt-2 text-center text-sm text-blue-fantastic">
        Establece una contraseña segura para activar tu cuenta de empresa.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        <PasswordInput
          label="Confirmar contraseña"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
        />

        <PasswordRequirements password={password} />

        {submitError && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-truffle-trouble/10 px-3 py-2 text-xs font-medium text-truffle-trouble"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-burning-flame font-bold text-white hover:bg-burning-flame/90"
        >
          {isSubmitting ? 'Activando...' : 'Activar cuenta'}
        </Button>
      </form>
    </div>
  );
}