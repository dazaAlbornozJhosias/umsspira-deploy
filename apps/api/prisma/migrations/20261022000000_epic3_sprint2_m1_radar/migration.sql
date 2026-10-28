-- AlterTable
ALTER TABLE "calculo_radar" ADD COLUMN     "hash_entrada" VARCHAR(64);

-- AlterTable
ALTER TABLE "afinidad_radar" ADD COLUMN     "palabras_clave_top" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "palabra_clave_no_mapeada_id_titulado_termino_key" ON "palabra_clave_no_mapeada"("id_titulado", "termino");

-- Restricciones de integridad del Radar (Epic 3, Sprint 2)

ALTER TABLE "palabra_clave_area"
ADD CONSTRAINT "palabra_clave_area_peso_check"
CHECK ("peso" BETWEEN 1 AND 5);

ALTER TABLE "afinidad_radar"
ADD CONSTRAINT "afinidad_radar_porcentaje_check"
CHECK ("porcentaje" BETWEEN 0 AND 100);

ALTER TABLE "afinidad_radar"
ADD CONSTRAINT "afinidad_radar_puntaje_check"
CHECK ("puntaje" >= 0);

ALTER TABLE "palabra_clave_no_mapeada"
ADD CONSTRAINT "palabra_clave_no_mapeada_frecuencia_check"
CHECK ("frecuencia" >= 1);
