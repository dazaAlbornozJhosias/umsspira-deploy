import { cancelEventRegistration } from "./events-service";
import { authenticatedFetch, SessionError } from "./auth-session";

jest.mock("./auth-session", () => ({
  ...jest.requireActual("./auth-session"),
  authenticatedFetch: jest.fn(),
}));

const fetchMock = jest.mocked(authenticatedFetch);

describe("Contrato HTTP de cancelación de inscripción", () => {
  beforeEach(() => fetchMock.mockReset());

  it("envía PATCH autenticado sin identidad ni body y acepta 204 sin JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => "",
    } as Response);
    await expect(
      cancelEventRegistration("inscripcion/1"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/events/registrations/inscripcion%2F1/cancel");
    expect(options).toMatchObject({ method: "PATCH", body: undefined });
    expect(new Headers(options?.headers).has("x-user-id")).toBe(false);
  });

  it("conserva el código del conflicto devuelto por el backend", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          error: {
            code: "EVENT_REGISTRATION_NOT_CONFIRMED",
            message: "No confirmada",
          },
        }),
    } as Response);
    await expect(cancelEventRegistration("id")).rejects.toMatchObject({
      status: 409,
      code: "EVENT_REGISTRATION_NOT_CONFIRMED",
    });
  });

  it("propaga el rechazo de sesión sin informar una cancelación exitosa", async () => {
    fetchMock.mockRejectedValue(new SessionError(401, "Inicia sesión"));
    await expect(cancelEventRegistration("id")).rejects.toMatchObject({
      status: 401,
    });
  });
});
