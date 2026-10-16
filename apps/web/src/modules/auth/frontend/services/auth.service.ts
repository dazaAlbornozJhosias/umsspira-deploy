
// Servicio de autenticación del módulo auth (HU-05)

import type { UserRole } from "@umsspira/shared-types";
export type { UserRole };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  role: UserRole;
}

// Mensaje fijo por CA-05.4: no revela si falló el correo o la contraseña
export const LOGIN_ERROR_MESSAGE = "Correo electrónico o contraseña incorrectos";

// El endpoint real ya está fusionado y verificado: se usa siempre.
// (El mock de abajo queda solo como referencia para pruebas locales sin backend.)
const USE_MOCK = false;

// El backend corre en el puerto 3000 y su controlador ya incluye el prefijo "api/auth"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function loginMock(credentials: LoginCredentials): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const email = credentials.email.trim().toLowerCase();

  if (email === "admin@umss.edu.bo" && credentials.password === "admin1234") {
    return {
      accessToken: "mock-token-administrador",
      role: "administrador",
    };
  }

  if (
    email === "titulado@umss.edu.bo" &&
    credentials.password === "titulado1234"
  ) {
    return {
      accessToken: "mock-token-titulado",
      role: "titulado",
    };
  }

  throw new Error(LOGIN_ERROR_MESSAGE);
}

async function loginRequest(
  credentials: LoginCredentials
): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  // 401 (credenciales) y 400 (validación): siempre el mismo mensaje genérico
  if (!response.ok) {
    throw new Error(LOGIN_ERROR_MESSAGE);
  }

  // El backend envuelve la respuesta en { data: ... }
  const json = (await response.json()) as { data: LoginResult };
  return json.data;
}

export function login(
  credentials: LoginCredentials
): Promise<LoginResult> {
  return USE_MOCK ? loginMock(credentials) : loginRequest(credentials);
}

// Destino tras iniciar sesión según el rol. El titulado entra al portal
// (decisión de coordinación; CA-05.3 queda pendiente de actualización por el PO).
export function getRedirectPath(role: UserRole): string {
  if (role === "administrador") return "/applications";
  if (role === "empresa") return "/companies";
  if (role === "titulado") return "/portal";
  return "/me";
}