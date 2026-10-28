BEGIN;

-- Detener la migración antes de reducir longitudes; nunca truncar datos existentes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "formacion_academica"
    WHERE char_length("institucion") > 150 OR char_length("titulo") > 150
      OR char_length("grado") > 50
  ) THEN
    RAISE EXCEPTION 'formacion_academica contiene textos que exceden los límites del Sprint 1; revisarlos antes de migrar';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "experiencia_laboral"
    WHERE char_length("empresa") > 150 OR char_length("cargo") > 100
  ) THEN
    RAISE EXCEPTION 'experiencia_laboral contiene textos que exceden los límites del Sprint 1; revisarlos antes de migrar';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "certificacion"
    WHERE char_length("nombre") > 150 OR char_length("entidad_emisora") > 150
      OR char_length("grado") > 50
  ) THEN
    RAISE EXCEPTION 'certificacion contiene textos que exceden los límites del Sprint 1; revisarlos antes de migrar';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "certificacion_respaldo" WHERE char_length("archivo_key") > 255
  ) THEN
    RAISE EXCEPTION 'certificacion_respaldo contiene claves de archivo de más de 255 caracteres; revisarlas antes de migrar';
  END IF;
END $$;


-- AlterTable
ALTER TABLE "formacion_academica" ALTER COLUMN "institucion" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "titulo" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "grado" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "experiencia_laboral" ALTER COLUMN "empresa" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "cargo" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "certificacion" ADD COLUMN     "estado_validacion" VARCHAR(20) NOT NULL DEFAULT 'sin_respaldo',
ALTER COLUMN "nombre" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "entidad_emisora" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "grado" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "certificacion_respaldo" ALTER COLUMN "archivo_key" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "formacion_respaldo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_formacion" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "archivo_key" VARCHAR(255) NOT NULL,
    "fecha_subida" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formacion_respaldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validacion_certificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_certificacion" UUID NOT NULL,
    "id_administrador_sistema" UUID NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "justificacion" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validacion_certificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Id_usuario" UUID,
    "Nombre" VARCHAR(100) NOT NULL,
    "Funcion" VARCHAR(100) NOT NULL,
    "Tabla_afectada" VARCHAR(63) NOT NULL,
    "Id_registro" UUID,
    "Fecha_hora" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "formacion_respaldo_id_formacion_idx" ON "formacion_respaldo"("id_formacion");

-- CreateIndex
CREATE INDEX "validacion_certificacion_id_certificacion_fecha_creacion_idx" ON "validacion_certificacion"("id_certificacion", "fecha_creacion");

-- CreateIndex
CREATE INDEX "validacion_certificacion_id_administrador_sistema_idx" ON "validacion_certificacion"("id_administrador_sistema");

-- CreateIndex
CREATE INDEX "auditoria_Id_usuario_Fecha_hora_idx" ON "auditoria"("Id_usuario", "Fecha_hora");

-- CreateIndex
CREATE INDEX "auditoria_Tabla_afectada_Id_registro_idx" ON "auditoria"("Tabla_afectada", "Id_registro");

-- AddForeignKey
ALTER TABLE "formacion_respaldo" ADD CONSTRAINT "formacion_respaldo_id_formacion_fkey" FOREIGN KEY ("id_formacion") REFERENCES "formacion_academica"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validacion_certificacion" ADD CONSTRAINT "validacion_certificacion_id_certificacion_fkey" FOREIGN KEY ("id_certificacion") REFERENCES "certificacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validacion_certificacion" ADD CONSTRAINT "validacion_certificacion_id_administrador_sistema_fkey" FOREIGN KEY ("id_administrador_sistema") REFERENCES "administrador_sistema"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_Id_usuario_fkey" FOREIGN KEY ("Id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Los CHECK complementan las notas del documento, que Prisma no expresa en el schema.
ALTER TABLE "formacion_respaldo" ADD CONSTRAINT "formacion_respaldo_tipo_check"
  CHECK ("tipo" IN ('FOTO', 'DOCUMENTO'));
ALTER TABLE "certificacion" ADD CONSTRAINT "certificacion_estado_validacion_check"
  CHECK ("estado_validacion" IN ('sin_respaldo', 'validado', 'observado'));
ALTER TABLE "validacion_certificacion" ADD CONSTRAINT "validacion_certificacion_estado_check"
  CHECK ("estado" IN ('con_respaldo', 'observado'));

COMMIT;
