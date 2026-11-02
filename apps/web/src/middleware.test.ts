import type { NextRequest } from "next/server";
import { middleware } from "./middleware";

/**
 * Aislar NextResponse evita depender del runtime Edge en Jest/jsdom.
 * La prueba ejecuta el middleware real y observa redirecciones, cookies
 * y decisiones de seguridad.
 */
jest.mock("next/server", () => {
  class TestResponse {
    status: number;
    kind: string;
    destination: string | null;
    headers = new Map<string, string>();
    cookies = { delete: jest.fn() };

    constructor(kind: string, status: number, destination: string | null = null) {
      this.kind = kind;
      this.status = status;
      this.destination = destination;
    }

    static redirect(destination: URL) {
      return new TestResponse("redirect", 307, destination.toString());
    }

    static next() {
      return new TestResponse("next", 200);
    }

    static rewrite(destination: URL, options?: { status?: number }) {
      return new TestResponse("rewrite", options?.status ?? 200, destination.toString());
    }
  }

  return { NextResponse: TestResponse };
});

function request(path: string, refresh?: string): NextRequest {
  return {
    url: "http://localhost:3001" + path,
    nextUrl: { pathname: path },
    cookies: {
      get: (name: string) => name === "umsspira_refresh" && refresh
        ? { value: refresh } : undefined,
    },
  } as unknown as NextRequest;
}

type ObservedResponse = {
  kind: string;
  status: number;
  destination: string | null;
  headers: Map<string, string>;
  cookies: { delete: jest.Mock };
};

function observed(result: Awaited<ReturnType<typeof middleware>>): ObservedResponse {
  return result as unknown as ObservedResponse;
}

function respond(status: number, role?: string) {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => ({ data: { role } }),
  });
}

describe("HU-EP09-04 / T4.1: middleware de reportería", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    respond(200, "administrador");
  });

  it("CA-01: visitante sin cookie va al login con el aviso requerido", async () => {
    const result = observed(await middleware(request("/reports")));
    expect(result.status).toBe(307);
    expect(result.destination).toBe(
      "http://localhost:3001/login?reportes=requiere-sesion",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("CA-03: administrador autenticado accede al módulo y sus subrutas", async () => {
    for (const path of ["/reports", "/reports/encuestas"]) {
      const result = observed(await middleware(request(path, "token-valido")));
      expect(result.kind).toBe("next");
      expect(result.headers.get("Cache-Control")).toBe("no-store");
    }
  });

  it("CA-02: titulado recibe redirección al portal con motivo visible", async () => {
    respond(200, "titulado");
    const result = observed(await middleware(request("/reports", "token-titulado")));
    expect(result.status).toBe(307);
    expect(result.destination).toBe(
      "http://localhost:3001/portal?acceso=reportes-no-autorizado",
    );
  });

  it("CA-06: HTTP 401 invalida las cuatro cookies y envía al login avisando la expiración", async () => {
    respond(401);
    const result = observed(await middleware(request("/reports", "token-caducado")));
    expect(result.status).toBe(307);
    expect(result.destination).toBe(
      "http://localhost:3001/login?reportes=sesion-expirada",
    );
    for (const name of [
      "umsspira_token", "umsspira_refresh", "umsspira_csrf", "umsspira_role",
    ]) {
      expect(result.cookies.delete).toHaveBeenCalledWith(name);
    }
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  });

  it("CA-05: HTTP 403 de sesión inválida también elimina cookies", async () => {
    respond(403);
    const result = observed(await middleware(request("/reports", "token-rechazado")));
    expect(result.status).toBe(307);
    expect(result.cookies.delete).toHaveBeenCalledTimes(4);
  });

  it("backend no disponible: responde 503 sin mostrar datos privados", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("sin conexión"));
    const result = observed(await middleware(request("/reports", "token-desconocido")));
    expect(result.kind).toBe("rewrite");
    expect(result.status).toBe(503);
    expect(result.destination).toBe(
      "http://localhost:3001/reportes-no-disponibles",
    );
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  });
});
