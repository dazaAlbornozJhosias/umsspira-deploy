/// <reference types="jest" />
import { clearSession, getSessionToken, saveSession } from "./session";

describe("sesión en memoria", () => {
  afterEach(() => {
    clearSession();
  });

  it("expone el token sin crear cookies de identidad desde JavaScript", () => {
    saveSession("token-de-prueba", "administrador", false);

    expect(getSessionToken()).toBe("token-de-prueba");
    expect(document.cookie).not.toContain("umsspira_token");
    expect(document.cookie).not.toContain("umsspira_role");
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

  it("no persiste el access token en localStorage", () => {
    saveSession("token-de-prueba", "empresa", false);

    expect(window.localStorage.getItem("token")).toBeNull();
    expect(getSessionToken()).toBe("token-de-prueba");
  });

  it("recupera el token de la sesión activa en memoria", () => {
    saveSession("token-de-prueba", "administrador", false);

    expect(getSessionToken()).toBe("token-de-prueba");
  });

  it("devuelve null sin sesión guardada", () => {
    expect(getSessionToken()).toBeNull();
  });
});
