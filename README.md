# Proyecto Fexco (nombre provisional — ajustar)

Monorepo con **pnpm workspaces**: API en NestJS, frontend en Next.js, tipos compartidos y base de datos en Supabase.

## Stack

- **apps/api** — NestJS (REST), Redis, Supabase como cliente de base de datos
- **apps/web** — Next.js 14 (App Router), Tailwind CSS
- **packages/shared-types** — Tipos TypeScript compartidos entre `api` y `web`
- **supabase/** — Migraciones SQL y seed de la base de datos
- Gestor de paquetes: **pnpm** (workspace único, `pnpm-workspace.yaml`)
- Husky + lint-staged + commitlint (Conventional Commits) para hooks de git

---

## Requisitos previos

- Node.js > 20
- pnpm (`corepack enable` o `npm i -g pnpm`)
- Docker (para `docker-compose.yml` — Redis / Supabase local si aplica)
 - git

## Instalación

```bash
git clone https://github.com/SaulCr0c0/UMSSPIRA.git
cd UMSSPIRA
pnpm install
```

Esto instala las dependencias de **todos** los workspaces (`apps/api`, `apps/web`, `packages/shared-types`) de una sola vez.

## Variables de entorno

El servicio de base de datos usa un archivo `.env` en la raíz del repositorio:

Si crean uno pasan la informacion al grupo 
para evitar problemas de seguridad.

Por ahora solo hay uno que es de la contrasenia
de la base de datos, se les pasara por el grupo 
de whatsapp.

## Levantar servicios locales (Docker)

```bash
docker compose up -d
```

Levanta y crea la base de datos, con esto ya tienen corriendo la base de datos de manera local. 

Para poder ejecutar y configurar la base de datos de manera local se puede utilizar dos extensiones o el 
el cliente de postgresql

* Database client o SQLtools: ambas te permiten 
hacer cambios en la bd en vscode
* DBeaver: cliente oficial te da una interfaz grafica para los cambios

(Recomendacion) si te equivocaste en tus cambios y no sabes como regresar solo apaga el docker compose con el comando


```
docker compose down -v  # WARNING: permanently deletes db_data and all local data; use `docker compose down` to preserve it
```

De esta manera puedes volver a crear la bd con el comando inicial de Docker y te dara una bd nueva.

Se recomienda apagar el docker una vez que termines tu trabajo 

## Ejecutar el proyecto

**Todo el monorepo en paralelo:**
```bash
pnpm dev
```

**Por separado**, en dos terminales:

```bash
# Backend (NestJS) — apps/api
pnpm --filter api dev

# Frontend (Next.js) — apps/web
pnpm --filter web dev
```

- API por defecto en `http://localhost:3000` (revisar `apps/api/src/main.ts`)
- Web por defecto en `http://localhost:3001`


## Despliegue

La infraestructura vive repartida así:

| Parte | Dónde | Configuración |
| --- | --- | --- |
| API (NestJS) | **Render** | `render.yaml` en la raíz del repo (versionado) |
| Web (Next.js) | **Vercel** | Se configura en el panel; no lleva archivo |
| Base de datos | **Supabase** (São Paulo) | `supabase/migrations/` + `supabase db push` |

### API en Render

`render.yaml` ya describe el servicio (`umsspira-api`): región `virginia`, plan `free`, rama `dev`, build `pnpm install && pnpm --filter api build` y health check en `/mentorship/status`. Validar cambios con `render blueprints validate render.yaml`.

Al crear el Blueprint, Render **pide en el dashboard** los valores de `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `WEB_ORIGIN` (están con `sync: false` para no commitear secretos). Se rellenan con los mismos valores de `apps/api/.env`.

> **Plan gratuito:** el servicio se duerme tras ~15 min sin tráfico y el primer request tarda ~50 s. Si eso molesta en las demostraciones, subir de plan.

### Web en Vercel

Al importar el repo hay que indicar **Root Directory = `apps/web`** y definir `NEXT_PUBLIC_API_URL` con la URL pública del API **antes del build** (se inlina en el bundle). Sin ella el frontend apunta a `http://localhost:3000`.

### Variables de entorno en producción

| Plataforma | Variable | Valor |
| --- | --- | --- |
| Render | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| Render | `SUPABASE_SERVICE_ROLE_KEY` | JWT `service_role` (la `sb_secret_…` **no** sirve para la API REST) |
| Render | `WEB_ORIGIN` | URL de Vercel. Varios orígenes separados por coma |
| Vercel | `NEXT_PUBLIC_API_URL` | URL pública del API en Render |

### Antes de mergear una épica

- Las migraciones **nunca se editan** una vez aplicadas: se añade un archivo nuevo.
- Cada épica puede traer variables de entorno nuevas: añadirlas en Render y Vercel, o la app arranca y falla en runtime.

## Colección de API (Postman)

Importar en Postman:
- `collection/companies.postman_collection.json`
- Environment: `collection/environments/local.postman_environment.json`

## Tests (web)

```bash
pnpm --filter web test
```

---

## Dónde trabaja cada equipo / tarea

> Regla general: **si el tipo se usa en API y en Web, va en `packages/shared-types`.** No dupliques interfaces.

### Backend — `apps/api/src/`

| Tarea / feature | Carpeta |
|---|---|
| Lógica de **empresas** (companies) | `modules/companies/companies.module.ts` (+ agregar `companies.controller.ts`, `companies.service.ts`) |
| Lógica de **ofertas de trabajo** (job postings) | `modules/job-postings/job-postings.module.ts` (+ controller/service) |
| Conexión a Supabase | `shared/lib/supabase.ts` |
| Conexión a Redis (cache, colas, sesiones) | `shared/lib/redis.ts` |
| Bootstrap / configuración global de Nest | `main.ts`, `app.module.ts` |
| Nuevo módulo (ej. usuarios, auth) | Crear carpeta hermana en `modules/<nombre>/` siguiendo el mismo patrón (`*.module.ts`, `*.controller.ts`, `*.service.ts`) |

> `dist/` es la salida compilada — **nunca se edita a mano**.

### Frontend — `apps/web/src/`

| Tarea / feature | Carpeta |
|---|---|
| Páginas privadas / dashboard (empresas, ofertas) | `app/(dashboard)/companies/page.tsx`, `app/(dashboard)/job-postings/page.tsx` |
| Layout del dashboard | `app/(dashboard)/layout.tsx` |
| Login / registro (páginas públicas) | `app/(public)/login/page.tsx`, `app/(public)/register/page.tsx` |
| Layout raíz / estilos globales | `app/layout.tsx`, `app/globals.css` |
| Componentes reutilizables (botones, inputs, cards, navbar) | `shared/components/` |
| Cliente HTTP hacia la API | `shared/services/api-client.ts` |
| Utilidades (ej. `cn` para clases Tailwind) | `shared/utils/cn.ts` |
| Nueva sección del dashboard | Nueva carpeta en `app/(dashboard)/<seccion>/page.tsx` |
| Nueva sección pública | Nueva carpeta en `app/(public)/<seccion>/page.tsx` |

### Tipos compartidos — `packages/shared-types/src/`

| Tarea | Archivo |
|---|---|
| Tipo/interface de Empresa | `company.ts` |
| Tipo/interface de Oferta de trabajo | `job-posting.ts` |
| Exportar nuevos tipos | agregarlos en `index.ts` |

Se importan en ambas apps como `@umsspira/shared-types`.


(Recomendacion) Todos los archivos creados y carpetas son para dar una idea a los devs de como estructurar el proyecto y para que React no nos marque como proyecto vacio, entonces sientanse en la libertad de crear sus carpetas y archivos siguiendo las reglas descritas


### Testing / Postman

| Tarea | Archivo |
|---|---|
| Nuevos endpoints a probar manualmente | Agregar request a `collection/companies.postman_collection.json` (o crear colección nueva por módulo) |
| Tests de componentes/páginas web | Junto al archivo o en `__tests__/`, config en `jest.config.js` / `jest.setup.js` |

---

Los tests para el backend seran con postman y los test del frontend estan configurados con jest, tomenlo en cuenta para su implementacion

## Convenciones de commits

Se usa **Conventional Commits** (validado por `commitlint.config.js` + Husky):

```
feat(api): agregar endpoint de creación de empresas
fix(web): corregir validación de formulario de login
chore: actualizar dependencias
```

Si el commit no esta con esa nomenclatura sera rechazado por git y si por alguna razon lo suben asi a github no se tomara en cuenta, tomenlo en cuenta.


## Recomendacion de cambios

Para los cambios se recomienda usar atomic commits, 
significa que no me suban 20 cambios en un commit pequenio cambio que hacen y lo suben de esa manera es mas facil encontrar el error.

Si el dev sube un cambio con 20 cambios y el codigo marca error, sera el encargado de realizar la correccion
asi que tomarlo en cuenta

## Flujo de ramas

- `main` → producción
- `dev` → integración
- `epic*` → rama de integracion de las HUs de una epic
- `feat/NumerodeGrupo-IDdelaHU-nombreCorto` → rama para el trabajo de las HUs

Ejemplo de rama HU: feat/G1-HU2-login

---
