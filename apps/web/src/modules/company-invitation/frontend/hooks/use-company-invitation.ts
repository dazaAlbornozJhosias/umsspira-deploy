'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  ActivateCompanyInvitationPayload,
  CompanyInvitationResponse,
} from '@umsspira/shared-types';
import {
  activateCompanyInvitation,
  validateCompanyInvitation,
} from '../services/company-invitation.service';
import { InvitationError, type InvitationFailureReason } from '../services/invitation-error';

export type InvitationStep = 'validating' | 'form' | 'activated' | 'error';

function toReason(error: unknown): InvitationFailureReason {
  return error instanceof InvitationError ? error.reason : 'unavailable';
}

export function useCompanyInvitation(token: string) {
  const [step, setStep] = useState<InvitationStep>('validating');
  const [invitation, setInvitation] = useState<CompanyInvitationResponse | null>(null);
  const [failure, setFailure] = useState<InvitationFailureReason | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    setStep('validating');
    setFailure(null);

    validateCompanyInvitation(token)
      .then((data) => {
        if (!isActive) return;
        setInvitation(data);
        setStep('form');
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setFailure(toReason(error));
        setStep('error');
      });

    return () => {
      isActive = false;
    };
  }, [token, attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  // Devuelve un mensaje para mostrar en el formulario, o null si no corresponde.
  const activate = useCallback(
    async (payload: ActivateCompanyInvitationPayload): Promise<string | null> => {
      try {
        await activateCompanyInvitation(token, payload);
        setStep('activated');
        return null;
      } catch (error) {
        const reason = toReason(error);
        if (reason === 'unavailable') {
          return 'No fue posible activar la cuenta. Inténtalo nuevamente.';
        }
        if (reason === 'validation') {
          return error instanceof Error ? error.message : 'Revisa la contraseña ingresada.';
        }
        setFailure(reason);
        setStep('error');
        return null;
      }
    },
    [token],
  );

  return { step, invitation, failure, retry, activate };
}