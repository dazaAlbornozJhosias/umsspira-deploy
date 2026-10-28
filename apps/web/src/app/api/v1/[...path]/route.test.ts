/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST, PATCH, GET } from "./route";

const originalFetch = global.fetch;
const originalInternalUrl = process.env.API_INTERNAL_URL;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.API_INTERNAL_URL = "http://backend:3000";
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalInternalUrl === undefined) delete process.env.API_INTERNAL_URL;
  else process.env.API_INTERNAL_URL = originalInternalUrl;
});

it("reenvía un archivo sin convertir sus bytes a texto", async () => {
  const bytes = new Uint8Array([0, 255, 128, 13, 10, 65]);
  fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
  const request = new NextRequest("http://frontend/api/v1/events/covers", {
    method: "POST",
    body: bytes,
    headers: {
      "Content-Type": "multipart/form-data; boundary=prueba",
      Authorization: "Bearer access",
    },
  });

  const result = await POST(request, {
    params: { path: ["events", "covers"] },
  });

  expect(result.status).toBe(201);
  expect(fetchMock.mock.calls[0][0]).toBe(
    "http://backend:3000/api/v1/events/covers",
  );
  expect(new Uint8Array(fetchMock.mock.calls[0][1].body)).toEqual(bytes);
  expect(fetchMock.mock.calls[0][1].headers.get("authorization")).toBe(
    "Bearer access",
  );
});

it("conserva el nombre y contenido de una descarga", async () => {
  fetchMock.mockResolvedValue(
    new Response("%PDF", {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reporte.pdf"',
      },
    }),
  );
  const request = new NextRequest(
    "http://frontend/api/v1/reports/graduate/pdf",
  );

  const result = await GET(request, {
    params: { path: ["reports", "graduates", "pdf"] },
  });

  expect(result.headers.get("content-disposition")).toBe(
    'attachment; filename="reporte.pdf"',
  );
  expect(await result.text()).toBe("%PDF");
});

it("reenvía PATCH con su cuerpo y conserva la respuesta sin contenido", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  const request = new NextRequest(
    "http://frontend/api/v1/mentorship/availability",
    {
      method: "PATCH",
      body: JSON.stringify({ availabilityStatus: "EN_PAUSA" }),
      headers: { "Content-Type": "application/json" },
    },
  );

  const result = await PATCH(request, {
    params: { path: ["mentorship", "availability"] },
  });

  expect(result.status).toBe(204);
  expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
});

it("permite el módulo nlp sin devolver 404", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { keywords: [] } }), { status: 200 }));
  const request = new NextRequest("http://frontend/api/v1/nlp/extract", {
    method: "POST",
    body: JSON.stringify({ text: "Node.js" }),
    headers: { "Content-Type": "application/json" },
  });

  const result = await POST(request, {
    params: { path: ["nlp", "extract"] },
  });

  expect(result.status).toBe(200);
  expect(fetchMock.mock.calls[0][0]).toBe("http://backend:3000/api/v1/nlp/extract");
});

it("permite el módulo radar sin devolver 404", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { areas: [] } }), { status: 200 }));
  const request = new NextRequest("http://frontend/api/v1/radar");

  const result = await GET(request, {
    params: { path: ["radar"] },
  });

  expect(result.status).toBe(200);
  expect(fetchMock.mock.calls[0][0]).toBe("http://backend:3000/api/v1/radar");
});
