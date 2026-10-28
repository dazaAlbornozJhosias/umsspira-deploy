/// <reference types="jest" />
import {
  ADMIN_HOME,
  COMPANY_HOME,
  decideAccess,
  homeFor,
  LOGIN_PATH,
  PORTAL_HOME,
  USER_HOME,
} from "./route-access";

describe("homeFor", () => {
  it("devuelve /applications para el rol administrador", () => {
    expect(homeFor("administrador")).toBe(ADMIN_HOME);
  });

  it("devuelve /companies para el rol empresa", () => {
    expect(homeFor("empresa")).toBe(COMPANY_HOME);
  });

  it("devuelve /portal para el rol titulado", () => {
    expect(homeFor("titulado")).toBe(PORTAL_HOME);
  });

  it("devuelve /me por defecto cuando el rol no está definido o es desconocido", () => {
    expect(homeFor(undefined)).toBe(USER_HOME);
    expect(homeFor("otro")).toBe(USER_HOME);
  });
});

describe("decideAccess", () => {
  describe("usuario sin sesión (sin token)", () => {
    it.each([
      "/applications",
      "/me",
      "/afinidad",
      "/afinidad/egresado",
      "/afinidad/reclutador",
      "/empresa/postulantes",
      "/postulantes",
    ])("redirige %s a /login cuando no hay token", (pathname) => {
      expect(decideAccess(pathname, undefined, undefined)).toEqual({
        allowed: false,
        redirectTo: LOGIN_PATH,
      });
    });
  });

  describe("panel administrativo (/applications)", () => {
    it("permite el acceso al administrador", () => {
      expect(decideAccess("/applications", "token-123", "administrador")).toEqual({
        allowed: true,
      });
    });

    it("redirige a /me si el rol no es administrador", () => {
      expect(decideAccess("/applications", "token-123", "titulado")).toEqual({
        allowed: false,
        redirectTo: USER_HOME,
      });
      expect(decideAccess("/applications", "token-123", "empresa")).toEqual({
        allowed: false,
        redirectTo: USER_HOME,
      });
    });
  });

  describe("rutas de afinidad para titulado (/afinidad y /afinidad/egresado)", () => {
    it.each(["/afinidad", "/afinidad/egresado"])(
      "permite el acceso a titulado y administrador en %s",
      (pathname) => {
        expect(decideAccess(pathname, "token-123", "titulado")).toEqual({
          allowed: true,
        });
        expect(decideAccess(pathname, "token-123", "administrador")).toEqual({
          allowed: true,
        });
      },
    );

    it.each(["/afinidad", "/afinidad/egresado"])(
      "redirige a /companies si entra una empresa en %s",
      (pathname) => {
        expect(decideAccess(pathname, "token-123", "empresa")).toEqual({
          allowed: false,
          redirectTo: COMPANY_HOME,
        });
      },
    );
  });

  describe("rutas de reclutador y postulantes (/afinidad/reclutador, /empresa/postulantes y /postulantes)", () => {
    it.each([
      "/afinidad/reclutador",
      "/empresa/postulantes",
      "/postulantes",
    ])("permite el acceso a empresa y administrador en %s", (pathname) => {
      expect(decideAccess(pathname, "token-123", "empresa")).toEqual({
        allowed: true,
      });
      expect(decideAccess(pathname, "token-123", "administrador")).toEqual({
        allowed: true,
      });
    });

    it.each([
      "/afinidad/reclutador",
      "/empresa/postulantes",
      "/postulantes",
    ])("redirige a /portal si entra un titulado en %s", (pathname) => {
      expect(decideAccess(pathname, "token-123", "titulado")).toEqual({
        allowed: false,
        redirectTo: PORTAL_HOME,
      });
    });
  });
});

describe("HU-004/T4.1: control de acceso a reportes (Admin) y encuestas (Titulado)", () => {
  it.each(["/reports", "/reports/detalle", "/surveys", "/surveys/formulario"])(
    "envía a login a un visitante de %s", (path) => {
      expect(decideAccess(path, undefined, undefined)).toEqual({
        allowed: false, redirectTo: LOGIN_PATH,
      });
    },
  );

  it.each(["/reports", "/reports/detalle"])(
    "permite al administrador acceder a %s", (path) => {
      expect(decideAccess(path, "token", "administrador")).toEqual({ allowed: true });
    },
  );

  it.each([
    ["titulado", PORTAL_HOME],
    ["empresa", COMPANY_HOME],
  ])("impide el acceso a /reports para %s", (role, redirectTo) => {
    expect(decideAccess("/reports", "token", role)).toEqual({
      allowed: false, redirectTo,
    });
    expect(decideAccess("/reports/detalle", "token", role)).toEqual({
      allowed: false, redirectTo,
    });
  });

  it.each(["/surveys", "/surveys/formulario", "/surveys/respuestas/1"])(
    "permite a titulado entrar en %s", (path) => {
      expect(decideAccess(path, "token", "titulado")).toEqual({ allowed: true });
    },
  );

  it.each([
    ["administrador", ADMIN_HOME],
    ["empresa", COMPANY_HOME],
  ])("impide a %s entrar en /surveys y sus subrutas", (role, redirectTo) => {
    for (const path of ["/surveys", "/surveys/formulario"]) {
      expect(decideAccess(path, "token", role)).toEqual({
        allowed: false, redirectTo,
      });
    }
  });

  it("no restringe falsos prefijos de las rutas protegidas", () => {
    expect(decideAccess("/reports-extra", "token", "titulado")).toEqual({ allowed: true });
    expect(decideAccess("/surveys-extra", "token", "administrador")).toEqual({ allowed: true });
  });
});
