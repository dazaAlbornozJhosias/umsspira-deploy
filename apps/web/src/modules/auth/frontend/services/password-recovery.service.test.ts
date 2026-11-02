import { ApiClientError, apiClient } from "@/shared/services/api-client";
import {
  RecoveryLinkError,
  requestPasswordRecovery,
  resetPassword,
  validateRecoveryLink,
} from "./password-recovery.service";

jest.mock("@/shared/services/api-client", () => {
  class ApiClientError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
    }
  }
  return { ApiClientError, apiClient: jest.fn() };
});

const mockedClient = apiClient as unknown as jest.Mock;

describe("password-recovery.service", () => {
  beforeEach(() => {
    mockedClient.mockReset();
    mockedClient.mockResolvedValue(undefined);
  });

  it("solicita el enlace al endpoint real con el correo", async () => {
    await requestPasswordRecovery("usuario@umss.edu.bo");
    expect(mockedClient).toHaveBeenCalledWith("/api/v1/auth/password-recovery/request", {
      method: "POST",
      body: { email: "usuario@umss.edu.bo" },
    });
  });

  it("valida el enlace enviando el token", async () => {
    await validateRecoveryLink("tok");
    expect(mockedClient).toHaveBeenCalledWith("/api/v1/auth/password-recovery/validate", {
      method: "POST",
      body: { token: "tok" },
    });
  });

  it("restablece la contraseña enviando token y contraseña", async () => {
    await resetPassword("tok", "Clave#2026");
    expect(mockedClient).toHaveBeenCalledWith("/api/v1/auth/password-recovery/reset", {
      method: "POST",
      body: { token: "tok", password: "Clave#2026" },
    });
  });

  it("convierte los códigos del backend en RecoveryLinkError", async () => {
    mockedClient.mockRejectedValue(new ApiClientError("vencido", 410, "RECOVERY_LINK_EXPIRED"));
    await expect(validateRecoveryLink("tok")).rejects.toMatchObject({
      name: "RecoveryLinkError",
      reason: "expired",
    });
    await expect(validateRecoveryLink("tok")).rejects.toBeInstanceOf(RecoveryLinkError);
  });

  it("propaga sin cambios los errores que no son del enlace", async () => {
    const failure = new ApiClientError("limite", 429, "RATE_LIMITED");
    mockedClient.mockRejectedValue(failure);
    await expect(resetPassword("tok", "Clave#2026")).rejects.toBe(failure);
  });
});