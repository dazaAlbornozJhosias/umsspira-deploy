-- ============================================================
-- 0004: Usar gen_random_uuid() (nativo de Postgres) en lugar de
-- uuid_generate_v4() (extensión uuid-ossp) en todos los DEFAULT
-- de columnas UUID del esquema public.
-- Solo cambia el DEFAULT; los datos existentes no se tocan.
-- Se puede correr más de una vez sin error.
-- ============================================================
DO $$
DECLARE
  col RECORD;
BEGIN
  FOR col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_default ILIKE '%uuid_generate_v4%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT gen_random_uuid()',
                   col.table_name, col.column_name);
  END LOOP;
END $$;
