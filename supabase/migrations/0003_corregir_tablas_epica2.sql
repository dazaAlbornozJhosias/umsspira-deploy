-- ============================================================
-- 0003: Correcciones de las tablas de la Épica 2 (perfil del titulado)
--  1. titulado.id_usuario: FK a usuario(usuario_id), única, nullable.
--  2. titulado.nombre: el nombre del titulado (hoy solo hay apellido).
--  3. formacion_academica.grado: lo pide el formulario (nullable).
--  4. DEFAULT now() en certificacion.fecha_creacion y
--     certificacion_respaldo.fecha_subida (pendiente de la HU4).
--  5. NOT NULL en las FK de las tablas hijas, solo si no hay filas
--     sin dueño. Si las hay, se avisa y esa columna se deja como está.
-- Se puede correr más de una vez sin error.
-- Pensada para `supabase db push` (el CLI ya la envuelve en una transacción).
-- ============================================================

-- 1. titulado.id_usuario
ALTER TABLE titulado ADD COLUMN IF NOT EXISTS id_usuario UUID;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_titulado_usuario') THEN
    ALTER TABLE titulado
      ADD CONSTRAINT fk_titulado_usuario
      FOREIGN KEY (id_usuario) REFERENCES usuario(usuario_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_titulado_usuario') THEN
    ALTER TABLE titulado ADD CONSTRAINT uq_titulado_usuario UNIQUE (id_usuario);
  END IF;
END $$;

-- 2. titulado.nombre
ALTER TABLE titulado ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);

-- 3. formacion_academica.grado
ALTER TABLE formacion_academica ADD COLUMN IF NOT EXISTS grado VARCHAR(50);

-- 4. Fechas automáticas
ALTER TABLE certificacion          ALTER COLUMN fecha_creacion SET DEFAULT now();
ALTER TABLE certificacion_respaldo ALTER COLUMN fecha_subida   SET DEFAULT now();

-- 5. NOT NULL en las FK de las tablas hijas (solo si no hay nulos)
DO $$
DECLARE
  objetivo RECORD;
  nulos BIGINT;
BEGIN
  FOR objetivo IN
    SELECT * FROM (VALUES
      ('formacion_academica',    'id_titulado'),
      ('experiencia_laboral',    'id_titulado'),
      ('certificacion',          'id_titulado'),
      ('certificacion_respaldo', 'id_certificacion')
    ) AS t(tabla, columna)
  LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE %I IS NULL', objetivo.tabla, objetivo.columna)
      INTO nulos;
    IF nulos = 0 THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET NOT NULL', objetivo.tabla, objetivo.columna);
    ELSE
      RAISE WARNING '%.% tiene % fila(s) con NULL; no se puso NOT NULL. Asigna o borra esas filas y vuelve a correr este archivo.',
        objetivo.tabla, objetivo.columna, nulos;
    END IF;
  END LOOP;
END $$;

/*
-- Verificación (correr aparte en el SQL Editor después del push): debe mostrar id_titulado / id_certificacion con is_nullable = NO,
-- las fechas con DEFAULT now() y las columnas nuevas.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('titulado', 'id_usuario'),
    ('titulado', 'nombre'),
    ('formacion_academica', 'grado'),
    ('formacion_academica', 'id_titulado'),
    ('experiencia_laboral', 'id_titulado'),
    ('certificacion', 'id_titulado'),
    ('certificacion', 'fecha_creacion'),
    ('certificacion_respaldo', 'id_certificacion'),
    ('certificacion_respaldo', 'fecha_subida')
  )
ORDER BY table_name, column_name;
*/
