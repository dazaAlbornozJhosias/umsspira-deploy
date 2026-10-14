// packages/shared-types/src/auth.ts

export type UserRole = "administrador" | "titulado" | "empresa";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  role: UserRole;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};