BEGIN;
SET LOCAL TIME ZONE 'UTC';

-- Convertir estados conserva la columna y sus datos; los valores desconocidos detienen la migración.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM mentoria_solicitud
    WHERE estado IS NOT NULL
      AND lower(btrim(estado)) NOT IN ('pendiente', 'aceptado', 'rechazado', 'cancelado')
  ) THEN
    RAISE EXCEPTION 'mentoria_solicitud.estado contiene valores no reconocidos; revisar antes de migrar';
  END IF;
  IF EXISTS (
    SELECT 1 FROM conexion
    WHERE estado IS NOT NULL AND lower(btrim(estado)) NOT IN ('activa', 'finalizada')
  ) THEN
    RAISE EXCEPTION 'conexion.estado contiene valores no reconocidos; revisar antes de migrar';
  END IF;
  IF EXISTS (
    SELECT 1 FROM sesion
    WHERE estado IS NOT NULL AND lower(btrim(estado)) NOT IN ('programado', 'completado', 'cancelado')
  ) THEN
    RAISE EXCEPTION 'sesion.estado contiene valores no reconocidos; revisar antes de migrar';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "estado_solicitud_mentoria" AS ENUM ('pendiente', 'aceptado', 'rechazado', 'cancelado');

-- CreateEnum
CREATE TYPE "estado_conexion_mentoria" AS ENUM ('activa', 'finalizada');

-- CreateEnum
CREATE TYPE "estado_sesion_mentoria" AS ENUM ('programado', 'completado', 'cancelado');

-- DropForeignKey
ALTER TABLE "certificacion_respaldo" DROP CONSTRAINT "certificacion_respaldo_id_certificacion_fkey";

-- AlterTable
ALTER TABLE "usuario" ALTER COLUMN "usuario_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "administrador_sistema" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_usuario" UUID;

-- AlterTable
ALTER TABLE "encuesta" ADD COLUMN     "area" VARCHAR(150),
ADD COLUMN     "cargo" VARCHAR(150),
ADD COLUMN     "condicion_laboral" BOOLEAN,
ADD COLUMN     "empresa" VARCHAR(200),
ADD COLUMN     "modalidad" VARCHAR(20),
ADD COLUMN     "salario_mensual" VARCHAR(30),
ADD COLUMN     "tiempo_insercion" VARCHAR(40);

-- AlterTable
ALTER TABLE "titulado" ADD COLUMN     "anio_egreso" SMALLINT,
ADD COLUMN     "bloqueado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expedido_en" VARCHAR(20),
ADD COLUMN     "rechazos_acumulados" SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "mentoria_solicitud" ALTER COLUMN "estado" TYPE "estado_solicitud_mentoria"
USING lower(btrim("estado"))::"estado_solicitud_mentoria";

-- AlterTable
ALTER TABLE "conexion" ALTER COLUMN "estado" TYPE "estado_conexion_mentoria"
USING lower(btrim("estado"))::"estado_conexion_mentoria";

-- AlterTable
ALTER TABLE "sesion" ALTER COLUMN "estado" TYPE "estado_sesion_mentoria"
USING lower(btrim("estado"))::"estado_sesion_mentoria";

-- AlterTable
ALTER TABLE "evento" ADD COLUMN     "archivado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_archivado" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "detalle_solicitud" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "solicitud" ADD COLUMN     "codigo_tit" VARCHAR,
ADD COLUMN     "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fecha_resolucion" TIMESTAMPTZ(6),
ADD COLUMN     "id_titulado" UUID,
ADD COLUMN     "observaciones_count" SMALLINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "solicitud_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_solicitud" UUID NOT NULL,
    "numero_version" INTEGER NOT NULL,
    "snapshot_detalle" JSONB NOT NULL,
    "id_documento_respaldo" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitud_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_activacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_solicitud" UUID NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "intentos_fallidos" SMALLINT NOT NULL DEFAULT 0,
    "consumido" BOOLEAN NOT NULL DEFAULT false,
    "invalidado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_activacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_subsanacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_solicitud" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_subsanacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correo_tramite" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_solicitud" UUID NOT NULL,
    "id_dictamen" UUID,
    "tipo" VARCHAR(20) NOT NULL,
    "email_destino" VARCHAR NOT NULL,
    "asunto" VARCHAR,
    "cuerpo" TEXT,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "intentos" SMALLINT NOT NULL DEFAULT 0,
    "ultimo_error" TEXT,
    "proveedor_id" VARCHAR,
    "fecha_envio" TIMESTAMPTZ(6),
    "fecha_ultimo_intento" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correo_tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_dictamen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_dictamen" UUID,
    "id_solicitud" UUID NOT NULL,
    "id_administrador_sistema" UUID,
    "accion" VARCHAR(30) NOT NULL,
    "estado_anterior" VARCHAR(20),
    "estado_nuevo" VARCHAR(20),
    "detalle" JSONB,
    "resultado" VARCHAR(10) NOT NULL DEFAULT 'exitoso',
    "motivo_fallo" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_dictamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pase_qr" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_inscripcion" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "fecha_generacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMPTZ(6),

    CONSTRAINT "pase_qr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palabra_clave" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR NOT NULL,
    "termino_normalizado" VARCHAR NOT NULL,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "palabra_clave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alias_palabra_clave" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_palabra_clave" UUID NOT NULL,
    "alias" VARCHAR NOT NULL,
    "alias_normalizado" VARCHAR NOT NULL,

    CONSTRAINT "alias_palabra_clave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palabra_clave_area" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_palabra_clave" UUID NOT NULL,
    "id_area" UUID NOT NULL,
    "peso" SMALLINT NOT NULL,

    CONSTRAINT "palabra_clave_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palabra_clave_no_mapeada" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_titulado" UUID NOT NULL,
    "termino" VARCHAR NOT NULL,
    "frecuencia" INTEGER NOT NULL,
    "fecha_deteccion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "palabra_clave_no_mapeada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculo_radar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_titulado" UUID NOT NULL,
    "version_algoritmo" VARCHAR NOT NULL,
    "estado" VARCHAR NOT NULL,
    "fecha_calculo" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculo_radar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afinidad_radar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_calculo_radar" UUID NOT NULL,
    "id_area" UUID NOT NULL,
    "puntaje" DECIMAL NOT NULL,
    "porcentaje" DECIMAL NOT NULL,

    CONSTRAINT "afinidad_radar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitud_version_id_documento_respaldo_idx" ON "solicitud_version"("id_documento_respaldo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_version_id_solicitud_numero_version_key" ON "solicitud_version"("id_solicitud", "numero_version");

-- CreateIndex
CREATE INDEX "otp_activacion_id_solicitud_consumido_invalidado_expira_en_idx" ON "otp_activacion"("id_solicitud", "consumido", "invalidado", "expira_en");

-- CreateIndex
CREATE UNIQUE INDEX "token_subsanacion_token_hash_key" ON "token_subsanacion"("token_hash");

-- CreateIndex
CREATE INDEX "token_subsanacion_id_solicitud_revocado_usado_expira_en_idx" ON "token_subsanacion"("id_solicitud", "revocado", "usado", "expira_en");

-- CreateIndex
CREATE INDEX "correo_tramite_id_solicitud_created_at_idx" ON "correo_tramite"("id_solicitud", "created_at");

-- CreateIndex
CREATE INDEX "correo_tramite_id_dictamen_idx" ON "correo_tramite"("id_dictamen");

-- CreateIndex
CREATE INDEX "auditoria_dictamen_id_solicitud_created_at_idx" ON "auditoria_dictamen"("id_solicitud", "created_at");

-- CreateIndex
CREATE INDEX "auditoria_dictamen_id_dictamen_idx" ON "auditoria_dictamen"("id_dictamen");

-- CreateIndex
CREATE INDEX "auditoria_dictamen_id_administrador_sistema_idx" ON "auditoria_dictamen"("id_administrador_sistema");

-- CreateIndex
CREATE UNIQUE INDEX "pase_qr_id_inscripcion_key" ON "pase_qr"("id_inscripcion");

-- CreateIndex
CREATE UNIQUE INDEX "pase_qr_token_hash_key" ON "pase_qr"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "palabra_clave_termino_normalizado_key" ON "palabra_clave"("termino_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "alias_palabra_clave_alias_normalizado_key" ON "alias_palabra_clave"("alias_normalizado");

-- CreateIndex
CREATE INDEX "alias_palabra_clave_id_palabra_clave_idx" ON "alias_palabra_clave"("id_palabra_clave");

-- CreateIndex
CREATE INDEX "palabra_clave_area_id_area_idx" ON "palabra_clave_area"("id_area");

-- CreateIndex
CREATE UNIQUE INDEX "palabra_clave_area_id_palabra_clave_id_area_key" ON "palabra_clave_area"("id_palabra_clave", "id_area");

-- CreateIndex
CREATE INDEX "palabra_clave_no_mapeada_id_titulado_fecha_deteccion_idx" ON "palabra_clave_no_mapeada"("id_titulado", "fecha_deteccion");

-- CreateIndex
CREATE INDEX "calculo_radar_id_titulado_fecha_calculo_idx" ON "calculo_radar"("id_titulado", "fecha_calculo");

-- CreateIndex
CREATE INDEX "afinidad_radar_id_area_idx" ON "afinidad_radar"("id_area");

-- CreateIndex
CREATE UNIQUE INDEX "afinidad_radar_id_calculo_radar_id_area_key" ON "afinidad_radar"("id_calculo_radar", "id_area");

-- CreateIndex
CREATE UNIQUE INDEX "administrador_sistema_id_usuario_key" ON "administrador_sistema"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_codigo_tit_key" ON "solicitud"("codigo_tit");

-- AddForeignKey
ALTER TABLE "administrador_sistema" ADD CONSTRAINT "administrador_sistema_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificacion_respaldo" ADD CONSTRAINT "certificacion_respaldo_id_certificacion_fkey" FOREIGN KEY ("id_certificacion") REFERENCES "certificacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_version" ADD CONSTRAINT "solicitud_version_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_version" ADD CONSTRAINT "solicitud_version_id_documento_respaldo_fkey" FOREIGN KEY ("id_documento_respaldo") REFERENCES "documento_respaldo"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_activacion" ADD CONSTRAINT "otp_activacion_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_subsanacion" ADD CONSTRAINT "token_subsanacion_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correo_tramite" ADD CONSTRAINT "correo_tramite_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correo_tramite" ADD CONSTRAINT "correo_tramite_id_dictamen_fkey" FOREIGN KEY ("id_dictamen") REFERENCES "dictamen"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_dictamen" ADD CONSTRAINT "auditoria_dictamen_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_dictamen" ADD CONSTRAINT "auditoria_dictamen_id_dictamen_fkey" FOREIGN KEY ("id_dictamen") REFERENCES "dictamen"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_dictamen" ADD CONSTRAINT "auditoria_dictamen_id_administrador_sistema_fkey" FOREIGN KEY ("id_administrador_sistema") REFERENCES "administrador_sistema"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pase_qr" ADD CONSTRAINT "pase_qr_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripcion_evento"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alias_palabra_clave" ADD CONSTRAINT "alias_palabra_clave_id_palabra_clave_fkey" FOREIGN KEY ("id_palabra_clave") REFERENCES "palabra_clave"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palabra_clave_area" ADD CONSTRAINT "palabra_clave_area_id_palabra_clave_fkey" FOREIGN KEY ("id_palabra_clave") REFERENCES "palabra_clave"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palabra_clave_area" ADD CONSTRAINT "palabra_clave_area_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "area"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palabra_clave_no_mapeada" ADD CONSTRAINT "palabra_clave_no_mapeada_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculo_radar" ADD CONSTRAINT "calculo_radar_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afinidad_radar" ADD CONSTRAINT "afinidad_radar_id_calculo_radar_fkey" FOREIGN KEY ("id_calculo_radar") REFERENCES "calculo_radar"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afinidad_radar" ADD CONSTRAINT "afinidad_radar_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "area"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Restricciones de las propuestas que Prisma no representa como CHECK.
ALTER TABLE titulado ADD CONSTRAINT titulado_rechazos_acumulados_check
  CHECK (rechazos_acumulados BETWEEN 0 AND 5);
ALTER TABLE solicitud ADD CONSTRAINT solicitud_observaciones_count_check
  CHECK (observaciones_count BETWEEN 0 AND 2);
ALTER TABLE otp_activacion ADD CONSTRAINT otp_activacion_intentos_fallidos_check
  CHECK (intentos_fallidos BETWEEN 0 AND 5);
ALTER TABLE correo_tramite ADD CONSTRAINT correo_tramite_tipo_check
  CHECK (tipo IN ('aprobacion', 'observacion', 'rechazo', 'otp', 'subsanacion'));
ALTER TABLE correo_tramite ADD CONSTRAINT correo_tramite_estado_check
  CHECK (estado IN ('pendiente', 'enviada', 'fallida'));
ALTER TABLE correo_tramite ADD CONSTRAINT correo_tramite_intentos_check CHECK (intentos >= 0);
ALTER TABLE auditoria_dictamen ADD CONSTRAINT auditoria_dictamen_accion_check
  CHECK (accion IN ('emision', 'reenvio_correo', 'correccion', 'revocacion', 'intento_prohibido'));
ALTER TABLE auditoria_dictamen ADD CONSTRAINT auditoria_dictamen_resultado_check
  CHECK (resultado IN ('exitoso', 'fallido'));
ALTER TABLE pase_qr ADD CONSTRAINT pase_qr_estado_check
  CHECK (estado IN ('VIGENTE', 'INVALIDADO', 'VENCIDO'));

-- Los nuevos datos privados se consumen mediante la API, no mediante clientes públicos de Supabase.
ALTER TABLE "solicitud_version" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_activacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "token_subsanacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "correo_tramite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auditoria_dictamen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pase_qr" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "palabra_clave" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alias_palabra_clave" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "palabra_clave_area" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "palabra_clave_no_mapeada" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calculo_radar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "afinidad_radar" ENABLE ROW LEVEL SECURITY;

COMMIT;
