-- CreateEnum
CREATE TYPE "estado_usuario" AS ENUM ('PENDIENTE', 'ACTIVO', 'BLOQUEADO', 'ELIMINADO');

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "correo" VARCHAR(254),
ADD COLUMN     "estado" "estado_usuario" NOT NULL DEFAULT 'PENDIENTE';

-- CreateTable
CREATE TABLE "cuenta_acceso" (
    "id_usuario" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "actualizada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuenta_acceso_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "rol_acceso" (
    "codigo" VARCHAR(40) NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rol_acceso_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "permiso_acceso" (
    "codigo" VARCHAR(100) NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permiso_acceso_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "rol_permiso" (
    "rol_codigo" VARCHAR(40) NOT NULL,
    "permiso_codigo" VARCHAR(100) NOT NULL,

    CONSTRAINT "rol_permiso_pkey" PRIMARY KEY ("rol_codigo","permiso_codigo")
);

-- CreateTable
CREATE TABLE "sesion_acceso" (
    "id" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "version_credenciales" INTEGER NOT NULL,
    "csrf_hash" CHAR(64) NOT NULL,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renovada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "revocada_en" TIMESTAMPTZ(6),
    "motivo_revocacion" VARCHAR(40),
    "recordar" BOOLEAN NOT NULL DEFAULT false,
    "agente" VARCHAR(256),

    CONSTRAINT "sesion_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renovacion_acceso" (
    "hash" CHAR(64) NOT NULL,
    "id_sesion" UUID NOT NULL,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumida_en" TIMESTAMPTZ(6),

    CONSTRAINT "renovacion_acceso_pkey" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE INDEX "sesion_acceso_id_usuario_revocada_en_expira_en_idx" ON "sesion_acceso"("id_usuario", "revocada_en", "expira_en");

-- CreateIndex
CREATE INDEX "renovacion_acceso_id_sesion_idx" ON "renovacion_acceso"("id_sesion");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- AddForeignKey
ALTER TABLE "cuenta_acceso" ADD CONSTRAINT "cuenta_acceso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_rol_codigo_fkey" FOREIGN KEY ("rol_codigo") REFERENCES "rol_acceso"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_permiso_codigo_fkey" FOREIGN KEY ("permiso_codigo") REFERENCES "permiso_acceso"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_acceso" ADD CONSTRAINT "sesion_acceso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renovacion_acceso" ADD CONSTRAINT "renovacion_acceso_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "sesion_acceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Catálogo mínimo de acceso: no incluye cuentas ni datos ficticios.
INSERT INTO "rol_acceso" ("codigo") VALUES ('administrador'), ('titulado'), ('empresa');
INSERT INTO "permiso_acceso" ("codigo") VALUES ('user:self:read'), ('auth:sessions:self'), ('solicitudes:read'), ('solicitudes:review'), ('eventos:manage'), ('reportes:read'), ('mentores:manage'), ('perfil:self:read'), ('perfil:self:write'), ('mentores:self:write'), ('eventos:read'), ('empresas:self:read'), ('empresas:self:write'), ('vacantes:create');
INSERT INTO "rol_permiso" ("rol_codigo", "permiso_codigo") VALUES ('administrador', 'user:self:read'), ('administrador', 'auth:sessions:self'), ('administrador', 'solicitudes:read'), ('administrador', 'solicitudes:review'), ('administrador', 'eventos:manage'), ('administrador', 'reportes:read'), ('administrador', 'mentores:manage'), ('titulado', 'user:self:read'), ('titulado', 'auth:sessions:self'), ('titulado', 'perfil:self:read'), ('titulado', 'perfil:self:write'), ('titulado', 'mentores:self:write'), ('titulado', 'eventos:read'), ('empresa', 'user:self:read'), ('empresa', 'auth:sessions:self'), ('empresa', 'empresas:self:read'), ('empresa', 'empresas:self:write'), ('empresa', 'vacantes:create'), ('empresa', 'eventos:read');

-- Los registros de seguridad solo se consultan desde el backend con Prisma.
ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cuenta_acceso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rol_acceso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permiso_acceso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rol_permiso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sesion_acceso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "renovacion_acceso" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "usuario" ADD CONSTRAINT "usuario_correo_normalizado" CHECK ("correo" IS NULL OR "correo" = lower(btrim("correo")));
ALTER TABLE "cuenta_acceso" ADD CONSTRAINT "cuenta_acceso_version_positiva" CHECK ("version" > 0);
