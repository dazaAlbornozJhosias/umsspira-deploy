# UMSSPIRA

Proyecto completo de UMSSPIRA: frontend en Next.js, backend en NestJS y PostgreSQL alojado en Supabase. Se trabaja desde la raíz del monorepo con **pnpm workspaces**; `pnpm run dev` inicia frontend y backend juntos.

## Stack

- **apps/api** — NestJS (REST), arquitectura hexagonal, Prisma y PostgreSQL. Redis es opcional para limitar solicitudes.
- **apps/web** — Next.js 14 (App Router), Tailwind CSS
- **packages/shared-types** — Tipos TypeScript compartidos entre `api` y `web`
- **apps/api/prisma/** — Schema de Prisma y migraciones de PostgreSQL
- **apps/api/scripts/seed/** — Catálogos y datos de demostración por épica
- Gestor de paquetes: **pnpm** (workspace único, `pnpm-workspace.yaml`)
- Husky + lint-staged + commitlint (Conventional Commits) para hooks de git

---

## Requisitos previos

- Node.js 22.12 o superior
- pnpm (`corepack enable` o `npm i -g pnpm`)
- Docker Desktop para los servicios auxiliares de desarrollo
- Git

## Instalación

```bash
git clone https://github.com/SaulCr0c0/UMSSPIRA.git
cd UMSSPIRA
pnpm install
```

Esto instala las dependencias de **todos** los workspaces (`apps/api`, `apps/web`, `packages/shared-types`) de una sola vez.

## Configuración inicial

Copiar `apps/api/.env.example` como `apps/api/.env` y completar `DATABASE_URL`, `DIRECT_URL` y `AUTH_JWT_SECRET`. Cada equipo utiliza las conexiones de su propia base. Supabase solo aloja PostgreSQL; no se necesitan claves de Supabase Auth ni `service_role`.

Para el frontend, copiar `apps/web/.env.example` como `apps/web/.env.local`. En desarrollo local, conservar `NEXT_PUBLIC_API_URL=http://localhost:3000`. Next.js escucha en el puerto `3001` y su proxy envía las peticiones al backend del puerto `3000`.

Abrir Docker Desktop y levantar el correo de prueba antes de iniciar la aplicación:

```bash
docker compose up -d --wait
```

Preparar la base siguiendo [estos pasos](apps/api/docs/pasos-crear-bd.txt). Desde la raíz, con el entorno configurado:

```bash
pnpm --filter api db:deploy
pnpm --filter api prisma:generate
pnpm --filter api db:seed:demo
```

El seed de demostración exige `APP_ENV=epic`, `dev` o `test`. Para cargar solo catálogos y permisos, usar `pnpm --filter api db:seed`. Las credenciales reales permanecen en archivos de entorno ignorados por Git.

La instalación y preparación de la base son pasos iniciales. No se repiten las migraciones ni el seed cada vez que se inicia el proyecto; se aplican cuando hay cambios que el equipo necesita incorporar.

## Levantar todo el proyecto

Desde la raíz, con Docker Desktop abierto:

```bash
docker compose up -d --wait
pnpm run dev
```

Docker inicia Mailpit y `--wait` espera a que esté disponible. `pnpm run dev` mantiene frontend y backend corriendo en la misma terminal. PostgreSQL local y Redis son opcionales y se activan con los perfiles explicados abajo.

- Aplicación web: http://localhost:3001
- Estado del backend y conexión a la base: http://localhost:3000/health
- Bandeja de correos de prueba: http://localhost:8025

Para detener la aplicación, usar `Ctrl+C`. Después, `docker compose --profile "*" down` detiene los servicios auxiliares, incluidos los perfiles opcionales, y conserva los volúmenes de datos y correos.

### Qué aporta Docker

| Servicio | Uso | Cómo levantarlo |
| --- | --- | --- |
| `mailpit` | Correos de registro, verificación y activación guardados en el volumen `mailpit_data`, sin enviarlos a Internet | `docker compose up -d --wait` |
| `redis` | Contadores temporales de límites de solicitudes | `docker compose --profile redis up -d --wait` |
| `db` | PostgreSQL local con datos persistidos en el volumen `db_data` | `docker compose --profile local-db up -d --wait` |

Con PostgreSQL alojado y el limitador en memoria, la aplicación puede arrancar sin Docker. Mailpit sigue siendo necesario para recibir correos locales con la configuración predeterminada. Levantar Redis o PostgreSQL en Docker no cambia las conexiones de la API: las decide su `.env`. Para usar Redis, agregar `AUTH_RATE_LIMIT_STORE=redis` y `REDIS_URL=redis://localhost:6379` en `apps/api/.env` y reiniciar la aplicación.

Los tres servicios tienen comprobaciones de salud, puertos accesibles solo desde esta PC y límites para sus archivos de logs. `docker compose --profile "*" ps` muestra su estado. Mailpit conserva hasta 1000 mensajes; Redis pierde sus contadores al reiniciarse.

Para levantar los tres servicios:

```bash
docker compose --profile local-db --profile redis up -d --wait
```

Para cambiar los puertos o la contraseña local, copiar el `.env.example` de la raíz como `.env`. Es opcional: Compose ya tiene valores locales predeterminados. Ese archivo configura Docker; no reemplaza los entornos de las aplicaciones.

Para conectar la API al PostgreSQL local, configurar `DATABASE_URL` y `DIRECT_URL` en `apps/api/.env` con `postgresql://postgres:umsspira_local@localhost:5432/postgres`, ajustando contraseña y puerto si se cambiaron, y aplicar las migraciones con Prisma. Docker crea la base vacía; Prisma crea las tablas. Se conserva la versión PostgreSQL 15 y el volumen `db_data` existentes. Un volumen previo mantiene sus credenciales y datos; no se transforma automáticamente desde el esquema antiguo.

### Ejecutar una sola aplicación

Para trabajar por separado, usar el comando correspondiente en su propia terminal:

```bash
# Backend (NestJS) — apps/api
pnpm --filter api dev

# Frontend (Next.js) — apps/web
pnpm --filter web dev
```

## Despliegue

La infraestructura vive repartida así:

| Parte | Dónde | Configuración |
| --- | --- | --- |
| API (NestJS) | **Render** | `render.yaml` en la raíz del repo (versionado) |
| Web (Next.js) | **Vercel** | Se configura en el panel; no lleva archivo |
| Base de datos | PostgreSQL alojado en **Supabase** | `apps/api/prisma/migrations/` + `pnpm --filter api db:deploy` |

### API en Render

`render.yaml` describe el servicio `umsspira-api`: raíz del monorepo, rama `dev`, compilación exclusiva del backend y health check en `/health`.

Configurar `DATABASE_URL`, `DIRECT_URL`, `AUTH_JWT_SECRET` y `CORS_ORIGINS`. Para enviar correos reales también se necesitan `SMTP_URL` y `MAIL_FROM`. Dejar `PORT` a cargo de Render.

> **Plan gratuito:** el servicio se duerme tras ~15 min sin tráfico y el primer request tarda ~50 s. Si eso molesta en las demostraciones, subir de plan.

### Web en Vercel

Al importar el repo hay que indicar **Root Directory = `apps/web`** y definir `NEXT_PUBLIC_API_URL` con la URL pública del API **antes del build** (se inlina en el bundle). Sin ella el frontend apunta a `http://localhost:3000`.

### Variables de entorno en producción

| Plataforma | Variable | Valor |
| --- | --- | --- |
| Render | `DATABASE_URL` | Conexión PostgreSQL de la API |
| Render | `DIRECT_URL` | Conexión PostgreSQL de migraciones y seeds |
| Render | `AUTH_JWT_SECRET` | Clave propia de firma de tokens |
| Render | `CORS_ORIGINS` | Origen de Vercel. Varios orígenes separados por coma |
| Vercel | `API_INTERNAL_URL` | URL raíz del backend para el proxy de Next.js |
| Vercel | `NEXT_PUBLIC_API_URL` | URL pública del API en Render |

### Antes de mergear una épica

- Las migraciones **nunca se editan** una vez aplicadas: se añade un archivo nuevo.
- Cada épica puede traer variables de entorno nuevas: añadirlas en Render y Vercel, o la app arranca y falla en runtime.

## Colección de API (Postman)

Importar `postman/UMSSPIRA.json`. También está disponible la colección `bruno/`, con instrucciones en [su README](bruno/README.md).

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
| Lógica de **empresas** (companies) | `modules/companies/` |
| Lógica de **ofertas de trabajo** (job postings) | `modules/job-postings/` |
| Conexión a PostgreSQL mediante Prisma | `shared/infrastructure/database/` |
| Conexión opcional a Redis para límites de solicitudes | `shared/infrastructure/redis/` |
| Bootstrap / configuración global de Nest | `main.ts`, `app.module.ts` |
| Nuevo módulo | `modules/<nombre>/`, siguiendo [las fronteras y convenciones](apps/api/src/modules/README.md) de dominio, aplicación, infraestructura y HTTP |

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
| Nuevos endpoints a probar manualmente | Agregar una petición por endpoint en `bruno/`, dentro del módulo correspondiente |
| Tests de componentes/páginas web | Junto al archivo o en `__tests__/`, config en `jest.config.js` / `jest.setup.js` |

---

Las pruebas automatizadas se ejecutan con `pnpm --filter api test` y `pnpm --filter web test`. Postman y Bruno permiten explorar los endpoints manualmente.

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
### ⚠️ Nota para Windows: crear el `.env` sin BOM

Si estás en Windows y creas el archivo `apps/api/.env` desde PowerShell o Notepad, es probable que se guarde con **BOM (Byte Order Mark)** o en **UTF-16**, y eso rompe el parser de `dotenv` de Node. El síntoma típico es:

Aunque el `.env` exista y tenga las variables, NestJS no las lee.

**Solución:** reescribir el `.env` en UTF-8 sin BOM desde PowerShell:

```powershell
$content = [System.IO.File]::ReadAllText("apps/api/.env")
[System.IO.File]::WriteAllText("$PWD\apps\api\.env", $content, (New-Object System.Text.UTF8Encoding $false))