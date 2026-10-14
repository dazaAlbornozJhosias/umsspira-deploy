-- ============================================================
-- 0005: Activar Row Level Security (RLS) en todas las tablas de public.
-- Sin políticas, las claves anon/authenticated no ven ni escriben nada;
-- service_role (backend) sigue con acceso completo.
-- Las políticas de cada tabla van en migraciones posteriores.
-- Se puede correr más de una vez sin error.
-- ============================================================
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind IN ('r', 'p')
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END $$;
