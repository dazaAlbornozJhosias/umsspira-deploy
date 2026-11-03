-- CreateTable
CREATE TABLE "certificacion_creacion" (
    "id_titulado" UUID NOT NULL,
    "id_operacion" UUID NOT NULL,
    "hash_entrada" VARCHAR(64) NOT NULL,
    "id_certificacion" UUID NOT NULL,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificacion_creacion_pkey" PRIMARY KEY ("id_titulado","id_operacion")
);

-- AddForeignKey
ALTER TABLE "certificacion_creacion" ADD CONSTRAINT "certificacion_creacion_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Registro interno del backend, sin acceso directo desde la Data API.
ALTER TABLE public.certificacion_creacion ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.certificacion_creacion FROM PUBLIC;
DO $$
DECLARE role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.certificacion_creacion FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
