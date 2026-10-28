-- AlterTable
ALTER TABLE "solicitud" ADD COLUMN     "activacion_expira_en" TIMESTAMPTZ(6),
ADD COLUMN     "activacion_hash" CHAR(64),
ADD COLUMN     "activacion_intentos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "activada_en" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "dictamen" ADD COLUMN     "categoria" VARCHAR(100),
ADD COLUMN     "decision" VARCHAR(20),
ADD COLUMN     "revisor_id" UUID;

-- CreateTable
CREATE TABLE "borrador_registro" (
    "id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "datos" JSONB NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "correo_verificado" BOOLEAN NOT NULL DEFAULT false,
    "codigo_hash" CHAR(64),
    "codigo_expira_en" TIMESTAMPTZ(6),
    "codigo_enviado_en" TIMESTAMPTZ(6),
    "codigo_intentos" INTEGER NOT NULL DEFAULT 0,
    "id_solicitud" UUID,

    CONSTRAINT "borrador_registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivo_registro" (
    "id" UUID NOT NULL,
    "id_borrador" UUID NOT NULL,
    "tipo_documento" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "mime" VARCHAR(50) NOT NULL,
    "contenido" BYTEA NOT NULL,
    "size_bytes" INTEGER NOT NULL,

    CONSTRAINT "archivo_registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correo_pendiente" (
    "id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "proximo_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "enviado_en" TIMESTAMPTZ(6),

    CONSTRAINT "correo_pendiente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "borrador_registro_token_hash_key" ON "borrador_registro"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "borrador_registro_id_solicitud_key" ON "borrador_registro"("id_solicitud");

-- CreateIndex
CREATE INDEX "borrador_registro_expira_en_idx" ON "borrador_registro"("expira_en");

-- CreateIndex
CREATE UNIQUE INDEX "archivo_registro_id_borrador_key" ON "archivo_registro"("id_borrador");

-- CreateIndex
CREATE INDEX "correo_pendiente_enviado_en_proximo_en_idx" ON "correo_pendiente"("enviado_en", "proximo_en");

-- AddForeignKey
ALTER TABLE "dictamen" ADD CONSTRAINT "dictamen_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrador_registro" ADD CONSTRAINT "borrador_registro_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivo_registro" ADD CONSTRAINT "archivo_registro_id_borrador_fkey" FOREIGN KEY ("id_borrador") REFERENCES "borrador_registro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Los respaldos son privados y se leen únicamente a través de los permisos de la API.
ALTER TABLE "borrador_registro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "archivo_registro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "correo_pendiente" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "archivo_registro" ADD CONSTRAINT "archivo_registro_tamano_check"
CHECK (size_bytes > 0 AND size_bytes <= 5242880 AND octet_length(contenido) = size_bytes);
