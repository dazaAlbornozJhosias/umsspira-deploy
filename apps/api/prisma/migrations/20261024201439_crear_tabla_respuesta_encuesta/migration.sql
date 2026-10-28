-- CreateTable
CREATE TABLE "respuesta_encuesta" (
    "id" UUID NOT NULL,
    "id_encuesta" UUID NOT NULL,
    "id_titulado" UUID NOT NULL,
    "condicion_laboral" TEXT NOT NULL,
    "cargo" VARCHAR(150),
    "empresa" VARCHAR(200),
    "area" VARCHAR(150),
    "modalidad" TEXT,
    "salario_mensual" VARCHAR(30),
    "tiempo_insercion" VARCHAR(40),
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuesta_encuesta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "respuesta_encuesta_id_encuesta_id_titulado_key" ON "respuesta_encuesta"("id_encuesta", "id_titulado");
