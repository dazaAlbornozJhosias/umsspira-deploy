import { clearAccessToken, setAccessToken } from "./auth-session";
import { getCompanyHeader } from "./companies";
import { createJobPosting } from "./job-postings";
import { getEventCatalog, registerForEvent } from "./events-service";
import { getGraduates } from "@/modules/reports/services/reports.service";
import { createRegistrationSession } from "@/modules/registration/frontend/services/registration.service";

const originalFetch = global.fetch;
const fetchMock = jest.fn();
const companyId = "41000000-0000-4000-8000-000000000001";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  setAccessToken("access-token");
});

afterEach(() => {
  global.fetch = originalFetch;
  clearAccessToken();
});

it("resuelve la empresa desde me y conserva los campos que consume su pantalla", async () => {
  const header = {
    nombre: "Empresa",
    eslogan: null,
    logoUrl: null,
    bannerUrl: null,
  };
  fetchMock
    .mockResolvedValueOnce(
      response({ data: { scopes: { companyIds: [companyId] } } }),
    )
    .mockResolvedValueOnce(response({ data: header }));

  await expect(getCompanyHeader()).resolves.toEqual(header);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "/api/v1/auth/me",
    `/api/v1/companies/${companyId}/header`,
  ]);
});

it("publica la vacante con empresaId obtenido de la identidad autenticada", async () => {
  fetchMock
    .mockResolvedValueOnce(
      response({ data: { scopes: { companyIds: [companyId] } } }),
    )
    .mockResolvedValueOnce(response({ data: { id: "vacante" } }));
  const input = {
    titulo: "Desarrollador",
    modalidad: "REMOTO",
    nivelExperiencia: "Junior",
    descripcionTecnica:
      "Descripción técnica del puesto y las habilidades requeridas.",
  };

  await createJobPosting(input);

  expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/job-postings");
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
    ...input,
    empresaId: companyId,
  });
});

it("extrae data del catálogo público de eventos sin exigir sesión", async () => {
  clearAccessToken();
  const events = [{ id: "evento", title: "Encuentro" }];
  fetchMock.mockResolvedValue(response({ data: events }));

  await expect(getEventCatalog()).resolves.toEqual(events);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/events/catalog");
});

it("confirma la inscripción HU3 sin enviar un body inventado", async () => {
  fetchMock.mockResolvedValue(response({ data: {
    id: "registration-1", eventId: "event-1", status: "CONFIRMADA",
    registeredAt: "2026-11-06T03:59:00.000Z", currentCapacity: 1,
  } }));

  await expect(registerForEvent("event-1")).resolves.toMatchObject({
    status: "CONFIRMADA", currentCapacity: 1,
  });
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/events/event-1/registrations");
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
  expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
});

it("conserva el código de negocio para mostrar errores HU3", async () => {
  fetchMock.mockResolvedValue(response({
    error: {
      code: "EVENT_REGISTRATION_ALREADY_CONFIRMED",
      message: "Ya existe una inscripción confirmada",
    },
  }, 409));

  await expect(registerForEvent("event-1")).rejects.toMatchObject({
    status: 409,
    code: "EVENT_REGISTRATION_ALREADY_CONFIRMED",
  });
});

it("adapta la paginación y los estados del reporte a los nombres de la pantalla", async () => {
  const graduate = {
    id: "51000000-0000-4000-8000-000000000001",
    nombre: "Ana",
    apellido: "Rojas",
    estado: "APROBADA",
    anioEgreso: 2025,
    telefono: "77777777",
    email: "ana@example.com",
    codSis: "202000001",
    fechaIngreso: "2020-01-01",
    fechaTitulacion: "2025-02-01",
    fechaCreacion: "2025-02-02T00:00:00Z",
    fechaRevision: "2025-02-03T00:00:00Z",
  };
  fetchMock.mockResolvedValue(
    response({ data: { items: [graduate], totalPages: 1 } }),
  );

  const result = await getGraduates();

  expect(result[0]).toMatchObject({
    fullName: "Rojas, Ana",
    status: "VERIFICADO",
    reviewDate: "03/02/2025",
  });
  expect(fetchMock.mock.calls[0][0]).toBe(
    "/api/v1/reports/graduates?page=1&limit=1000",
  );
});

it("adapta los errores Zod a los campos que muestra el formulario de registro", async () => {
  fetchMock.mockResolvedValue(
    response(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos inválidos",
          fields: { correo: ["Correo inválido"] },
        },
      },
      400,
    ),
  );

  await expect(createRegistrationSession({})).resolves.toMatchObject({
    ok: false,
    message: "Datos inválidos",
    errors: [{ field: "correo", message: "Correo inválido" }],
  });
});
