// Contratos de la verificación de correo (HU-02).
// Solo tipos: este paquete no puede importar librerías de infraestructura.

export type ResendCodeInput = {
  registrationId: string;
};

export type VerifyEmailInput = {
  registrationId: string;
  code: string;
};

export type IssueCodeResultDTO = {
  // Correo con la parte central oculta, por ejemplo ju****z@gmail.com
  maskedEmail: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
};

export type VerifyEmailResultDTO = {
  verified: true;
};