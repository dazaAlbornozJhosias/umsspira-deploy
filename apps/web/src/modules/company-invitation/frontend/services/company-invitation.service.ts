   import type {
     ActivateCompanyInvitationPayload,
     CompanyInvitationResponse,
   } from '@umsspira/shared-types';
   import { apiUrl, readApiError } from '@/shared/services/api-contract';
   import {
     INVITATION_TOKEN_PATTERN,
     InvitationError,
     type InvitationFailureReason,
   } from './invitation-error';

   const REASON_BY_CODE: Record<string, InvitationFailureReason> = {
     INVITATION_TOKEN_INVALID: 'invalid',
     INVITATION_NOT_FOUND: 'invalid',
     INVITATION_EXPIRED: 'expired',
     INVITATION_ALREADY_USED: 'used',
     INVITATION_EMAIL_IN_USE: 'used',
     VALIDATION_ERROR: 'validation',
   };

   async function sendRequest<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
     let response: Response;
     try {
       response = await fetch(apiUrl(path), {
         ...init,
         headers: { 'Content-Type': 'application/json' },
         cache: 'no-store',
       });
     } catch {
       throw new InvitationError('unavailable', 'No hay conexión con el servidor.');
     }

     const body: unknown = await response.json().catch(() => null);

     if (!response.ok) {
       const { code, message } = readApiError(body, 'No fue posible procesar la invitación.');
       const reasonFromCode = code ? REASON_BY_CODE[code] : undefined;
       const reason = reasonFromCode ?? (response.status >= 500 ? 'unavailable' : 'invalid');
       throw new InvitationError(reason, message);
     }

     return (body as { data: TResponse }).data;
   }

   function assertTokenFormat(token: string): void {
     // HU-01 CA-11 y CA-12: sin token o con formato inválido no se consulta al servidor.
     if (!INVITATION_TOKEN_PATTERN.test(token)) {
       throw new InvitationError('invalid', 'El enlace de invitación no es válido.');
     }
   }

   export async function validateCompanyInvitation(token: string): Promise<CompanyInvitationResponse> {
     assertTokenFormat(token);
     return sendRequest<CompanyInvitationResponse>(
       `/api/v1/companies/invitations/${encodeURIComponent(token)}`,
     );
   }

   export async function activateCompanyInvitation(
     token: string,
     payload: ActivateCompanyInvitationPayload,
   ): Promise<void> {
     assertTokenFormat(token);
     await sendRequest(`/api/v1/companies/invitations/${encodeURIComponent(token)}/activate`, {
       method: 'POST',
       body: JSON.stringify(payload),
     });
   }