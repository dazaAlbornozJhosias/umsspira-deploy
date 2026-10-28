-- AlterTable
ALTER TABLE "evento" ADD COLUMN     "id_portada" UUID;

-- CreateTable
CREATE TABLE "archivo_perfil" (
    "id_respaldo" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "mime" VARCHAR(50) NOT NULL,
    "contenido" BYTEA NOT NULL,
    "size_bytes" INTEGER NOT NULL,

    CONSTRAINT "archivo_perfil_pkey" PRIMARY KEY ("id_respaldo")
);

-- CreateTable
CREATE TABLE "portada_evento" (
    "id" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "mime" VARCHAR(50) NOT NULL,
    "contenido" BYTEA NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portada_evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portada_evento_id_usuario_idx" ON "portada_evento"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "evento_id_portada_key" ON "evento"("id_portada");

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_portada_fkey" FOREIGN KEY ("id_portada") REFERENCES "portada_evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivo_perfil" ADD CONSTRAINT "archivo_perfil_id_respaldo_fkey" FOREIGN KEY ("id_respaldo") REFERENCES "certificacion_respaldo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portada_evento" ADD CONSTRAINT "portada_evento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Solo la API accede a los bytes y comprueba propiedad y publicación.
ALTER TABLE archivo_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE portada_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivo_perfil ADD CONSTRAINT archivo_perfil_size_check
  CHECK (size_bytes > 0 AND size_bytes <= 5242880 AND octet_length(contenido) = size_bytes);
ALTER TABLE portada_evento ADD CONSTRAINT portada_evento_size_check
  CHECK (size_bytes > 0 AND size_bytes <= 5242880 AND octet_length(contenido) = size_bytes);
