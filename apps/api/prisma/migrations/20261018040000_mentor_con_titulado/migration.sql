ALTER TABLE "mentor"
  ADD COLUMN "descripcion" VARCHAR(500),
  ADD COLUMN "foto_perfil" TEXT,
  ADD COLUMN "id_titulado" UUID,
  ADD COLUMN "informacion_relevante" VARCHAR(500);

-- El backend anterior confundía el identificador del mentor con el del usuario.
-- La relación se recupera antes de exigir la nueva clave foránea.
UPDATE "mentor" AS m
SET "id_titulado" = COALESCE(
  (SELECT t.id FROM titulado AS t WHERE t.id_usuario = m.id),
  (SELECT t.id FROM titulado AS t WHERE t.id = m.id)
);

DO $$
DECLARE
  item RECORD;
  information JSONB;
BEGIN
  IF EXISTS (SELECT 1 FROM mentor WHERE id_titulado IS NULL) THEN
    RAISE EXCEPTION 'Hay mentores sin titulado asociado: vincularlos antes de aplicar la migración';
  END IF;

  -- La información deja de almacenarse como JSON dentro del campo experiencia.
  FOR item IN SELECT id, experiencia FROM mentor WHERE experiencia IS NOT NULL LOOP
    BEGIN
      information := item.experiencia::jsonb;
    EXCEPTION WHEN invalid_text_representation THEN
      CONTINUE;
    END;
    IF jsonb_typeof(information) = 'object' THEN
      UPDATE mentor SET
        descripcion = LEFT(information->>'descripcion', 500),
        informacion_relevante = LEFT(information->>'informacion_relevante', 500),
        foto_perfil = information->>'foto_perfil',
        experiencia = information->>'experiencia'
      WHERE id = item.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE "mentor" ALTER COLUMN "id_titulado" SET NOT NULL;
CREATE UNIQUE INDEX "mentor_id_titulado_key" ON "mentor"("id_titulado");
ALTER TABLE "mentor" ADD CONSTRAINT "mentor_id_titulado_fkey"
  FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
