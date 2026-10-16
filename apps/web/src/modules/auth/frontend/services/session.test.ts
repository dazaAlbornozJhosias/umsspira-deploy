/// <reference types="jest" />
import { clearSession, getSessionToken, saveSession } from "./session";

describe("sesión en cookies", () => {
  afterEach(() => {
    clearSession();
  });

  it("guarda el token y el rol", () => {
    saveSession("token-de-prueba", "administrador", false);

    expect(document.cookie).toContain("umsspira_token=token-de-prueba");
    expect(document.cookie).toContain("umsspira_role=administrador");
  });

  it("borra la sesión al cerrarla", () => {
    saveSession("token-de-prueba", "titulado", true);
    window.sessionStorage.setItem("umsspira.access-token", "token-de-prueba");

    clearSession();

    expect(document.cookie).not.toContain("umsspira_token");
    expect(document.cookie).not.toContain("umsspira_role");
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.sessionStorage.getItem("umsspira.access-token")).toBeNull();
  });

  it("replica el token en localStorage para la Epic 4", () => {
    saveSession("token-de-prueba", "empresa", false);

    expect(window.localStorage.getItem("token")).toBe("token-de-prueba");
  });

  it("recupera el token de la cookie tras recargar la página", () => {
    saveSession("token-de-prueba", "administrador", false);

    expect(getSessionToken()).toBe("token-de-prueba");
  });

  it("devuelve null sin sesión guardada", () => {
    expect(getSessionToken()).toBeNull();
  });
});