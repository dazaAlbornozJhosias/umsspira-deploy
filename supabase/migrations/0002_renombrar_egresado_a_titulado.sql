-- ============================================================
-- 0002: Renombrar "egresado" a "titulado"
-- Renombra la tabla, las columnas id_egresado y los nombres de las FK.
-- Los datos y las relaciones se conservan.
-- Cada cambio se hace solo si hace falta: funciona igual sobre un 0001 con "egresado"
-- (rama epic2), sobre uno que ya trae "titulado" (rama dev) o sobre la BD de Supabase,
-- donde la tabla ya se había renombrado a mano.
-- ============================================================
DO $$
DECLARE
  cambio RECORD;
BEGIN
  -- Tabla principal
  IF to_regclass('public.egresado') IS NOT NULL AND to_regclass('public.titulado') IS NULL THEN
    ALTER TABLE egresado RENAME TO titulado;
  END IF;

  -- Columnas id_egresado -> id_titulado
  FOR cambio IN
    SELECT * FROM (VALUES
      ('curriculum_vitae'), ('formacion_academica'), ('experiencia_laboral'),
      ('certificacion'), ('perfil_area')
    ) AS t(tabla)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = cambio.tabla AND column_name = 'id_egresado') THEN
      EXECUTE format('ALTER TABLE %I RENAME COLUMN id_egresado TO id_titulado', cambio.tabla);
    END IF;
  END LOOP;

  -- Nombres de las FK
  FOR cambio IN
    SELECT * FROM (VALUES
      ('titulado',            'fk_egresado_carrera',       'fk_titulado_carrera'),
      ('curriculum_vitae',    'fk_cv_egresado',            'fk_cv_titulado'),
      ('formacion_academica', 'fk_formacion_egresado',     'fk_formacion_titulado'),
      ('experiencia_laboral', 'fk_experiencia_egresado',   'fk_experiencia_titulado'),
      ('certificacion',       'fk_certificacion_egresado', 'fk_certificacion_titulado'),
      ('perfil_area',         'fk_perfil_area_egresado',   'fk_perfil_area_titulado')
    ) AS t(tabla, viejo, nuevo)
  LOOP
    IF EXISTS (SELECT 1 FROM pg_constraint
               WHERE conname = cambio.viejo AND conrelid = format('public.%I', cambio.tabla)::regclass) THEN
      EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', cambio.tabla, cambio.viejo, cambio.nuevo);
    END IF;
  END LOOP;

  -- Nombres automáticos que Postgres generó en el 0001
  IF to_regclass('public.egresado_pkey') IS NOT NULL THEN
    ALTER INDEX egresado_pkey RENAME TO titulado_pkey;
  END IF;
  IF to_regclass('public.curriculum_vitae_id_egresado_key') IS NOT NULL THEN
    ALTER INDEX curriculum_vitae_id_egresado_key RENAME TO curriculum_vitae_id_titulado_key;
  END IF;
END $$;
