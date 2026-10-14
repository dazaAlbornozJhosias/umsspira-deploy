-- ============================================================
-- SCRIPT ÚNICO DE LA BASE DE DATOS (épicas 1-9)
-- Esquema que esperan el backend y el frontend + datos de demostración.
--
-- Ejecutar este archivo COMPLETO desde el editor SQL del panel de Supabase
-- (rol con permisos de escritura). Un solo archivo y en un solo paso deja la
-- BD tal como la leen y escriben el backend y el frontend.
--
-- PARTE 1 · ESQUEMA: aplica los cambios de supabase/migrations que todavía no
--   están en la BD, en versión re-ejecutable (IF NOT EXISTS / CREATE OR
--   REPLACE / DROP IF EXISTS). Si el líder de BD aplica después las migraciones
--   formales, no pasa nada: esta parte se vuelve un no-op y el resultado final
--   es el mismo.
--     * Columnas que envían los formularios: detalle_solicitud.expedido_en,
--       vacante.nivel_experiencia y vacante.descripcion_tecnica, y las columnas
--       del perfil corporativo de empresa.
--     * Funciones que invoca el backend: fun_registrar_solicitud y
--       fun_existe_solicitud_activa.
--     * Trigger de registro (auth.users -> usuario), índices del perfil,
--       buckets de Storage y políticas RLS del flujo de solicitudes.
--
-- PARTE 2 · DATOS: puebla catálogos y entidades de demostración con UUID fijo
--   (ON CONFLICT DO NOTHING), para que coincidan con los POST del frontend y la
--   colección Postman:
--   * Épica 6 (mentoría): usuario/titulado/mentor + áreas e intereses +
--     disponibilidad para el usuario de prueba del guard de desarrollo.
--   * Épica 6 (empresa/vacantes): empresa demo del dev-token + vacantes.
--   * Épica 4 (eventos): eventos publicados y un borrador.
--   * Épica 8 (registro/validación): catálogo tipo_archivo/carrera y
--     solicitudes en varios estados para la bandeja y los reportes.
--   * Épica 5 (reportes): catálogo tipo_reporte.
--
-- Verificación rápida después de ejecutar:
--   SELECT (SELECT count(*) FROM area) AS areas,
--          (SELECT count(*) FROM solicitud) AS solicitudes;
--
-- Se puede ejecutar varias veces: cada fila lleva un UUID fijo y usa
-- ON CONFLICT DO NOTHING, así que no duplica datos y siempre termina en el
-- mismo estado, en la nube o en local y sin importar el orden de ejecución.
--
-- Es el ÚNICO seed del proyecto: los datos de supabase/seed.dev.sql (empresa
-- demo) y de supabase/seed-hu4-demo.sql (15 expedientes de la bandeja) se
-- consolidaron aquí; esos dos archivos quedaron como avisos que apuntan a este.
--
-- IDs fijos que usan otras herramientas (no cambiar):
--   a0000000-0000-4000-8000-000000000001  usuario EMPRESA (scripts/dev-token.js)
--   b0000000-0000-4000-8000-000000000001  empresa del dev-token (empresaId del JWT)
--   00000000-0000-4000-8000-000000000006  mentor de pruebas (mentor-test-auth.guard:
--                                         token umsspira-local-mentor-test-only)
--   20000000-0000-4000-8000-000000000001  área raíz "Desarrollo Web" (ejemplos Postman)
--   20000000-0000-4000-8000-000000000002  área raíz "DevOps" (ejemplos Postman)
--   11111111-1111-4111-8111-111111111111  interés "Node.js" (variable interestId)
--
-- Notas para QA (evitar "peleas" al probar los formularios):
--   * El registro de titulado rechaza duplicados por ci, correo o código SIS.
--     Las 22 solicitudes de este seed ocupan los suyos (listar con
--     SELECT ci, email, cod_sis FROM detalle_solicitud); para registrar una
--     solicitud nueva use otros valores, o ponga antes esas solicitudes en
--     estado 'rechazado'/'rechazada'.
--   * Los estados de `solicitud` conviven en varios dialectos porque así los
--     escribe el código: 'Pendiente' (registro), 'APPROVED'/'OBSERVED'/
--     'REJECTED' (dictamen) y 'verificado'/'observado' (reporte PDF).
--   * Los eventos guardan `estado` en minúsculas ('publicado'/'borrador') tal
--     como los escribe la API, aunque los DTO usen 'BORRADOR'/'PUBLICADO'.
--   * Este seed NO crea usuarios de Supabase Auth ni toca Storage. El login de
--     la web valida contra Supabase Auth (panel > Authentication > Users) y lee
--     el rol de app_metadata.role ('administrador' | 'titulado'); al crearlos,
--     ponga también user_metadata con { nombre, rol } para que el trigger
--     on_auth_user_created deje la fila de usuario con el mismo nombre y rol.
--     Quedaron creados los dos usuarios de demostración (mismas credenciales
--     que el mock de apps/web/.../auth.service.ts):
--       admin@umss.edu.bo / admin1234      -> administrador
--       titulado@umss.edu.bo / titulado1234 -> titulado
--     El resto de pruebas usa los tokens de desarrollo (scripts/dev-token.js y
--     el guard de mentor).
--   * No se usan las columnas vacante.nivel_experiencia,
--     vacante.descripcion_tecnica ni detalle_solicitud.expedido_en porque no
--     están aplicadas en todas las bases (migraciones 0002_ajuste_detalle_solicitud
--     y 0003_vacante_campos_publicacion pendientes en la BD en la nube).
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1 · ESQUEMA (migraciones pendientes, en versión re-ejecutable)
-- ============================================================

-- ------------------------------------------------------------
-- 1.1 Columnas del perfil del titulado (migración 0003)
-- ------------------------------------------------------------
ALTER TABLE titulado ADD COLUMN IF NOT EXISTS id_usuario UUID;
ALTER TABLE titulado ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE formacion_academica ADD COLUMN IF NOT EXISTS grado VARCHAR(50);

ALTER TABLE certificacion          ALTER COLUMN fecha_creacion SET DEFAULT now();
ALTER TABLE certificacion_respaldo ALTER COLUMN fecha_subida   SET DEFAULT now();

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

-- ------------------------------------------------------------
-- 1.2 Columnas que envían los formularios y la BD todavía no tiene
-- ------------------------------------------------------------

-- detalle_solicitud.expedido_en (CA-01.4): lo envía el registro de titulado y
-- lo escribe fun_registrar_solicitud.
ALTER TABLE detalle_solicitud
  ADD COLUMN IF NOT EXISTS expedido_en VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detalle_solicitud_expedido_en_check'
  ) THEN
    ALTER TABLE detalle_solicitud
      ADD CONSTRAINT detalle_solicitud_expedido_en_check
      CHECK (expedido_en IN ('LP','CB','SC','OR','PT','TJ','CH','BE','PD','Extranjero'));
  END IF;
END $$;

-- vacante: los envía el formulario de publicación de vacantes.
ALTER TABLE vacante
  ADD COLUMN IF NOT EXISTS nivel_experiencia VARCHAR(50),
  ADD COLUMN IF NOT EXISTS descripcion_tecnica TEXT;

-- empresa: perfil corporativo (encabezado, detalle institucional y auditoría).
ALTER TABLE empresa
  ADD COLUMN IF NOT EXISTS eslogan VARCHAR(200),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS tamano_empresa VARCHAR(45),
  ADD COLUMN IF NOT EXISTS descripcion_larga TEXT,
  ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN empresa.eslogan IS 'Texto corto de presentacion de la empresa';
COMMENT ON COLUMN empresa.logo_url IS 'URL del logo corporativo almacenado';
COMMENT ON COLUMN empresa.banner_url IS 'URL de la imagen de fondo del perfil';
COMMENT ON COLUMN empresa.tamano_empresa IS 'Rango de tamano (ej: 50-200 empleados)';
COMMENT ON COLUMN empresa.descripcion_larga IS 'Descripcion institucional hasta 2000 caracteres';
COMMENT ON COLUMN empresa.fecha_actualizacion IS 'Fecha de ultima modificacion del perfil';

-- ------------------------------------------------------------
-- 1.3 Funciones que invoca el backend
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fun_existe_solicitud_activa(
    p_ci            VARCHAR,
    p_extension_ci  VARCHAR,
    p_email         VARCHAR,
    p_cod_sis       NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_existe BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM detalle_solicitud ds
        INNER JOIN solicitud s ON s.id_detalle_solicitud = ds.id
       WHERE LOWER(s.estado) NOT IN ('rechazado', 'rechazada')
          AND (
                (ds.ci = p_ci
                 AND COALESCE(ds.extension_ci, '') = COALESCE(p_extension_ci, ''))
             OR LOWER(ds.email) = LOWER(p_email)
             OR ds.cod_sis = p_cod_sis
          )
    )
    INTO v_existe;

    RETURN v_existe;
END;
$$;

CREATE OR REPLACE FUNCTION fun_registrar_solicitud(
    p_id_carrera        UUID,
    p_nombre            VARCHAR(45),
    p_apellido          VARCHAR(45),
    p_telefono          VARCHAR(20),
    p_email             VARCHAR(255),
    p_fecha_titulacion  DATE,
    p_fecha_ingreso     DATE,
    p_ci                VARCHAR(20),
    p_extension_ci      VARCHAR(20),
    p_expedido_en         VARCHAR(20),
    p_anio_egreso       SMALLINT,
    p_cod_sis           NUMERIC,
    p_desea_mentor      BOOLEAN,
    p_id_tipo_archivo   UUID,
    p_tamanio_mb        INTEGER,
    p_ruta_storage      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_detalle     UUID;
    v_id_documento   UUID;
    v_id_solicitud   UUID;
BEGIN
    IF p_ci IS NULL OR TRIM(p_ci) = '' THEN
        RAISE EXCEPTION 'El CI es obligatorio' USING ERRCODE = '23502';
    END IF;

    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RAISE EXCEPTION 'El email es obligatorio' USING ERRCODE = '23502';
    END IF;

    IF p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'El email % no tiene un formato válido', p_email
            USING ERRCODE = '22023';
    END IF;

    IF p_id_carrera IS NULL OR NOT EXISTS (SELECT 1 FROM carrera WHERE id = p_id_carrera) THEN
        RAISE EXCEPTION 'La carrera no existe' USING ERRCODE = '23503';
    END IF;

    IF p_id_tipo_archivo IS NULL OR NOT EXISTS (SELECT 1 FROM tipo_archivo WHERE id = p_id_tipo_archivo) THEN
        RAISE EXCEPTION 'El tipo de archivo no existe' USING ERRCODE = '23503';
    END IF;

    INSERT INTO detalle_solicitud (
        id_carrera, nombre, apellido, telefono, email,
        fecha_titulacion, fecha_ingreso, ci, extension_ci, expedido_en,
        anio_egreso, cod_sis, desea_mentor
    ) VALUES (
        p_id_carrera, p_nombre, p_apellido, p_telefono, LOWER(p_email),
        p_fecha_titulacion, p_fecha_ingreso, p_ci, p_extension_ci, p_expedido_en,
        p_anio_egreso, p_cod_sis, COALESCE(p_desea_mentor, FALSE)
    )
    RETURNING id INTO v_id_detalle;

    INSERT INTO documento_respaldo (
        id_tipo_archivo, tamanio_mb, ruta_storage, fecha_creacion, es_valido
    ) VALUES (
        p_id_tipo_archivo, p_tamanio_mb, p_ruta_storage, NOW(), FALSE
    )
    RETURNING id INTO v_id_documento;

    INSERT INTO solicitud (
        id_detalle_solicitud, id_documento_respaldo, estado, fecha_creacion
    ) VALUES (
        v_id_detalle, v_id_documento, 'Pendiente', NOW()
    )
    RETURNING id INTO v_id_solicitud;

    RETURN jsonb_build_object(
        'ok',            TRUE,
        'id_solicitud',  v_id_solicitud,
        'estado',        'Pendiente',
        'mensaje',       'Solicitud registrada correctamente'
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al registrar solicitud: %', SQLERRM;
END;
$$;

-- ------------------------------------------------------------
-- 1.4 Índices del perfil del titulado (migración 0012)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_formacion_academica_id_titulado
  ON formacion_academica (id_titulado);

CREATE INDEX IF NOT EXISTS idx_experiencia_laboral_id_titulado
  ON experiencia_laboral (id_titulado);

CREATE INDEX IF NOT EXISTS idx_certificacion_id_titulado
  ON certificacion (id_titulado);

CREATE INDEX IF NOT EXISTS idx_certificacion_respaldo_id_certificacion
  ON certificacion_respaldo (id_certificacion);

-- ------------------------------------------------------------
-- 1.5 Registro: auth.users -> usuario (migración 0009)
-- ------------------------------------------------------------
ALTER TABLE usuario ALTER COLUMN usuario_id DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.usuario (usuario_id, nombre, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'titulado')
    )
    ON CONFLICT (usuario_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 1.6 Buckets de Storage (migraciones 0006 y 0007)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('respaldos-certificacion', 'respaldos-certificacion', false, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-respaldo', 'documentos-respaldo', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 1.7 Permisos del backend y Row Level Security
-- ------------------------------------------------------------

-- El backend escribe con el rol de servicio: se le confirman los permisos por
-- si la BD se creó sin los privilegios por defecto.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role';
    EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role';
  END IF;
END $$;

-- RLS activo en todas las tablas de public (migración 0005). Sin políticas,
-- las claves anon/authenticated no ven ni escriben nada; el backend (rol de
-- servicio) y el rol postgres siguen con acceso completo.
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

-- Función auxiliar y políticas del flujo de solicitudes (migración 0008).
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM usuario
        WHERE usuario_id = auth.uid() AND rol = 'administrador'
    );
$$;

ALTER TABLE detalle_solicitud   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_respaldo  ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud           ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_solicitud   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictamen            ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detalle_select_admin_o_propio" ON detalle_solicitud;
CREATE POLICY "detalle_select_admin_o_propio"
ON detalle_solicitud FOR SELECT
TO authenticated
USING (
    public.es_admin()
    OR EXISTS (
        SELECT 1 FROM usuario_solicitud us
        WHERE us.detalle_solicitud_id = detalle_solicitud.id
          AND us.id_usuario = auth.uid()
    )
);

DROP POLICY IF EXISTS "detalle_insert_publico" ON detalle_solicitud;
CREATE POLICY "detalle_insert_publico"
ON detalle_solicitud FOR INSERT
TO anon, authenticated
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "detalle_update_admin" ON detalle_solicitud;
CREATE POLICY "detalle_update_admin"
ON detalle_solicitud FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "detalle_delete_admin" ON detalle_solicitud;
CREATE POLICY "detalle_delete_admin"
ON detalle_solicitud FOR DELETE
TO authenticated
USING (public.es_admin());

DROP POLICY IF EXISTS "documento_select_admin_o_propio" ON documento_respaldo;
CREATE POLICY "documento_select_admin_o_propio"
ON documento_respaldo FOR SELECT
TO authenticated
USING (
    public.es_admin()
    OR EXISTS (
        SELECT 1
        FROM solicitud s
        JOIN usuario_solicitud us ON us.id_solicitud = s.id
        WHERE s.id_documento_respaldo = documento_respaldo.id
          AND us.id_usuario = auth.uid()
    )
);

DROP POLICY IF EXISTS "documento_insert_publico" ON documento_respaldo;
CREATE POLICY "documento_insert_publico"
ON documento_respaldo FOR INSERT
TO anon, authenticated
WITH CHECK (
    ruta_storage IS NOT NULL
    AND tamanio_mb IS NOT NULL
    AND tamanio_mb > 0
    AND tamanio_mb <= 5
);

DROP POLICY IF EXISTS "documento_update_admin_o_propio_si_abierta" ON documento_respaldo;
CREATE POLICY "documento_update_admin_o_propio_si_abierta"
ON documento_respaldo FOR UPDATE
TO authenticated
USING (
    public.es_admin()
    OR (
        documento_respaldo.es_valido = FALSE
        AND EXISTS (
            SELECT 1
            FROM solicitud s
            JOIN usuario_solicitud us ON us.id_solicitud = s.id
            WHERE s.id_documento_respaldo = documento_respaldo.id
              AND us.id_usuario = auth.uid()
              AND s.estado IN ('Pendiente', 'Observado')
        )
    )
)
WITH CHECK (
    public.es_admin()
    OR (
        es_valido = FALSE
        AND EXISTS (
            SELECT 1
            FROM solicitud s
            JOIN usuario_solicitud us ON us.id_solicitud = s.id
            WHERE s.id_documento_respaldo = documento_respaldo.id
              AND us.id_usuario = auth.uid()
              AND s.estado IN ('Pendiente', 'Observado')
        )
    )
);

DROP POLICY IF EXISTS "documento_delete_admin" ON documento_respaldo;
CREATE POLICY "documento_delete_admin"
ON documento_respaldo FOR DELETE
TO authenticated
USING (public.es_admin());

DROP POLICY IF EXISTS "solicitud_select_admin_o_propio" ON solicitud;
CREATE POLICY "solicitud_select_admin_o_propio"
ON solicitud FOR SELECT
TO authenticated
USING (
    public.es_admin()
    OR EXISTS (
        SELECT 1 FROM usuario_solicitud us
        WHERE us.id_solicitud = solicitud.id
          AND us.id_usuario = auth.uid()
    )
);

DROP POLICY IF EXISTS "solicitud_insert_publico" ON solicitud;
CREATE POLICY "solicitud_insert_publico"
ON solicitud FOR INSERT
TO anon, authenticated
WITH CHECK (
    id_detalle_solicitud IS NOT NULL
    AND id_documento_respaldo IS NOT NULL
    AND estado = 'Pendiente'
);

DROP POLICY IF EXISTS "solicitud_update_admin" ON solicitud;
CREATE POLICY "solicitud_update_admin"
ON solicitud FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (
    public.es_admin()
    AND estado IN ('Aprobado', 'Observado', 'Rechazado')
);

DROP POLICY IF EXISTS "solicitud_delete_admin" ON solicitud;
CREATE POLICY "solicitud_delete_admin"
ON solicitud FOR DELETE
TO authenticated
USING (public.es_admin());

DROP POLICY IF EXISTS "usuario_solicitud_select_propio_o_admin" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_select_propio_o_admin"
ON usuario_solicitud FOR SELECT
TO authenticated
USING (
    id_usuario = auth.uid()
    OR public.es_admin()
);

DROP POLICY IF EXISTS "usuario_solicitud_insert_propio_o_anon" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_insert_propio_o_anon"
ON usuario_solicitud FOR INSERT
TO anon, authenticated
WITH CHECK (
    id_usuario = auth.uid()
    OR public.es_admin()
    OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "usuario_solicitud_update_admin" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_update_admin"
ON usuario_solicitud FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "usuario_solicitud_delete_admin" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_delete_admin"
ON usuario_solicitud FOR DELETE
TO authenticated
USING (public.es_admin());

DROP POLICY IF EXISTS "dictamen_select_admin_o_propio" ON dictamen;
CREATE POLICY "dictamen_select_admin_o_propio"
ON dictamen FOR SELECT
TO authenticated
USING (
    public.es_admin()
    OR EXISTS (
        SELECT 1
        FROM solicitud s
        JOIN usuario_solicitud us ON us.id_solicitud = s.id
        WHERE s.id = dictamen.id_solicitud
          AND us.id_usuario = auth.uid()
    )
);

DROP POLICY IF EXISTS "dictamen_insert_admin" ON dictamen;
CREATE POLICY "dictamen_insert_admin"
ON dictamen FOR INSERT TO authenticated
WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "dictamen_update_admin" ON dictamen;
CREATE POLICY "dictamen_update_admin"
ON dictamen FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "dictamen_delete_admin" ON dictamen;
CREATE POLICY "dictamen_delete_admin"
ON dictamen FOR DELETE
TO authenticated
USING (public.es_admin());

-- ============================================================
-- PARTE 2 · DATOS DE DEMOSTRACIÓN
-- ============================================================

-- ------------------------------------------------------------
-- 1. Catálogo de carreras
--     La carrera de Sistemas reutiliza el id que ya tenía la BD en la nube
--     (la crearon a mano como "Ingeniería de Sistemas (EJEMPLO)"); el
--     DO UPDATE normaliza el nombre para que todas las bases queden iguales.
-- ------------------------------------------------------------
INSERT INTO carrera (id, nombre) VALUES
  ('94c12c08-2743-40c2-a75a-6818391091b8', 'Ingeniería de Sistemas'),
  ('10000000-0000-4000-8000-000000000002', 'Ingeniería Informática')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Unificación de la carrera de Sistemas: versiones anteriores de este seed la
-- crearon con otro id (10000000-...-001). Se mueve todo lo que la referencie a
-- la fila definitiva y se elimina la duplicada, así cualquier BD queda igual.
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'id_carrera'
  LOOP
    EXECUTE format(
      'UPDATE public.%I SET id_carrera = %L WHERE id_carrera = %L',
      t.table_name,
      '94c12c08-2743-40c2-a75a-6818391091b8',
      '10000000-0000-4000-8000-000000000001'
    );
  END LOOP;
  DELETE FROM carrera WHERE id = '10000000-0000-4000-8000-000000000001';
END $$;

-- ------------------------------------------------------------
-- 2. Tipos de archivo: primero los formatos que busca el registro de
--    titulación (PDF/PNG/JPG según el MIME del archivo) y luego los tipos
--    de documento que usa como respaldo.
-- ------------------------------------------------------------
INSERT INTO tipo_archivo (id, nombre) VALUES
  ('21000000-0000-4000-8000-000000000001', 'PDF'),
  ('21000000-0000-4000-8000-000000000002', 'PNG'),
  ('21000000-0000-4000-8000-000000000003', 'JPG'),
  ('21000000-0000-4000-8000-000000000004', 'Título en Provisión Nacional'),
  ('21000000-0000-4000-8000-000000000005', 'Diploma Académico'),
  ('21000000-0000-4000-8000-000000000006', 'Certificado de Egreso')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Modalidades de trabajo (catálogo de requerimientos laborales)
-- ------------------------------------------------------------
INSERT INTO modalidad_trabajo (id, nombre) VALUES
  ('22000000-0000-4000-8000-000000000001', 'PRESENCIAL'),
  ('22000000-0000-4000-8000-000000000002', 'HIBRIDO'),
  ('22000000-0000-4000-8000-000000000003', 'REMOTO')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. Tipos de reporte (épica 5)
-- ------------------------------------------------------------
INSERT INTO tipo_reporte (id, nombre, descripcion, disponibilidad) VALUES
  ('23000000-0000-4000-8000-000000000001', 'Nómina de egresados', 'Listado de titulados por carrera y estado.', TRUE),
  ('23000000-0000-4000-8000-000000000002', 'Solicitudes de titulación', 'Estado de las solicitudes recibidas.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 5. Áreas técnicas (raíces) e intereses (hijos) para mentoría y perfil
--    Regla del módulo: raíz = padre_id NULL; interés = hijo de una raíz.
--    area.nombre admite máximo 20 caracteres.
-- ------------------------------------------------------------
INSERT INTO area (id, nombre, padre_id, esta_activo, fecha_creacion, fecha_actualizacion) VALUES
  ('20000000-0000-4000-8000-000000000001', 'Desarrollo Web', NULL, TRUE, CURRENT_DATE, CURRENT_DATE),
  ('20000000-0000-4000-8000-000000000002', 'DevOps', NULL, TRUE, CURRENT_DATE, CURRENT_DATE),
  ('20000000-0000-4000-8000-000000000003', 'Bases de Datos', NULL, TRUE, CURRENT_DATE, CURRENT_DATE),
  ('20000000-0000-4000-8000-000000000004', 'Ciencia de Datos', NULL, TRUE, CURRENT_DATE, CURRENT_DATE),
  ('20000000-0000-4000-8000-000000000005', 'Ciberseguridad', NULL, TRUE, CURRENT_DATE, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO area (id, nombre, padre_id, esta_activo, fecha_creacion, fecha_actualizacion) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Node.js', '20000000-0000-4000-8000-000000000001', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111112', 'React', '20000000-0000-4000-8000-000000000001', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111113', 'Angular', '20000000-0000-4000-8000-000000000001', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111121', 'Docker', '20000000-0000-4000-8000-000000000002', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111122', 'Kubernetes', '20000000-0000-4000-8000-000000000002', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111123', 'CI/CD', '20000000-0000-4000-8000-000000000002', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111131', 'PostgreSQL', '20000000-0000-4000-8000-000000000003', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111132', 'MongoDB', '20000000-0000-4000-8000-000000000003', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111141', 'Python', '20000000-0000-4000-8000-000000000004', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111142', 'Machine Learning', '20000000-0000-4000-8000-000000000004', TRUE, CURRENT_DATE, CURRENT_DATE),
  ('11111111-1111-4111-8111-111111111151', 'Pentesting', '20000000-0000-4000-8000-000000000005', TRUE, CURRENT_DATE, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. Usuarios de demostración
--    usuario.usuario_id no tiene DEFAULT: el UUID se indica siempre.
-- ------------------------------------------------------------
INSERT INTO usuario (usuario_id, nombre, rol) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Panificadora San Jose', 'EMPRESA'),
  ('00000000-0000-4000-8000-000000000006', 'Carlos Méndez Rojas', 'titulado'),
  ('00000000-0000-4000-8000-000000000002', 'Jhoan López Vargas', 'administrador')
ON CONFLICT (usuario_id) DO NOTHING;

-- ------------------------------------------------------------
-- 7. Empresa demo (mismos IDs que supabase/seed.dev.sql y scripts/dev-token.js)
-- ------------------------------------------------------------
INSERT INTO empresa (id, id_usuario, razon_social, nit, descripcion, correo, sitio_web, fecha_registro) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Panificadora San Jose S.R.L.', '1023456019', 'Panaderia y reposteria de alta calidad en Cochabamba.', 'contacto@panificadorasanjose.com', 'https://www.panificadorasanjose.com', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO telefono_empresa (id, id_empresa, numero, tipo) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '+591 4 4251234', 'PRINCIPAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO direccion_empresa (id, id_empresa, departamento, direccion) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Cochabamba', 'Avenida San Martin #450, Zona Norte, Cochabamba, Bolivia')
ON CONFLICT (id) DO NOTHING;

-- Columnas del perfil corporativo (migración 0002_empresa_columnas_perfil).
-- Se completan solo si esa migración ya está aplicada, de modo que el seed
-- funciona igual antes y después de ella y termina con el mismo perfil de
-- empresa que contenía supabase/seed.dev.sql.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'empresa' AND column_name = 'eslogan'
  ) THEN
    UPDATE empresa SET
      eslogan             = 'Calidad y tradición para cada día.',
      logo_url            = NULL,
      banner_url          = NULL,
      tamano_empresa      = '50-200 empleados',
      descripcion_larga   = 'Panificadora San Jose S.R.L. es una empresa dedicada a la elaboración y comercialización de productos de panadería y repostería de alta calidad, consolidada con más de 15 años de experiencia en el mercado local.',
      fecha_actualizacion = NOW()
    WHERE id = 'b0000000-0000-4000-8000-000000000001';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 8. Mentor de pruebas (HU 6.1 a HU 6.4)
--    La elegibilidad de mentor exige titulado.id = <UUID del usuario>, así que
--    titulado y mentor comparten el mismo UUID del usuario de pruebas.
--    mentor.experiencia guarda el JSON que arma PATCH my-profile/information.
-- ------------------------------------------------------------
INSERT INTO titulado (id, id_usuario, nombre, apellido, cod_sis, id_carrera, ci, extension_ci, anio_ingreso, grado) VALUES
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000006', 'Carlos', 'Méndez Rojas', 201712345, '94c12c08-2743-40c2-a75a-6818391091b8', '6543210', 'CB', 2017, 'Licenciatura')
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor (id, experiencia, esta_activo, anios_exp, fecha_creacion, fecha_actualizacion) VALUES
  ('00000000-0000-4000-8000-000000000006', '{"descripcion":"Ingeniero de Sistemas especializado en arquitecturas backend.","experiencia":"Más de 6 años desarrollando APIs REST con Node.js y PostgreSQL.","informacion_relevante":"Disponible para sesiones de orientación los martes y jueves.","foto_perfil":null}', TRUE, 6, CURRENT_DATE, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentor_area (id, id_mentor, id_area, fecha_creacion) VALUES
  ('50000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', CURRENT_DATE),
  ('50000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', CURRENT_DATE),
  ('50000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', CURRENT_DATE),
  ('50000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111121', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- Una sola fila por mentor: el servicio toma la más reciente si hay varias.
INSERT INTO disponibilidad_mentor (id, id_mentor, estado, fecha_creacion, fecha_actualizacion, hora_inicio, hora_fin) VALUES
  ('50000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000006', 'AVAILABLE', CURRENT_DATE, CURRENT_DATE, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 9. Administradores (padres de dictamen, reporte y encuesta)
-- ------------------------------------------------------------
INSERT INTO administrador_sistema (id, id_carrera) VALUES
  ('90000000-0000-4000-8000-000000000001', '94c12c08-2743-40c2-a75a-6818391091b8')
ON CONFLICT (id) DO NOTHING;

INSERT INTO administrador_de_carrera (id, id_usuario, id_carrera, estado, fecha_registro) VALUES
  ('90000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '94c12c08-2743-40c2-a75a-6818391091b8', 'Activo', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 10. Vacantes de la empresa demo (POST /api/vacantes)
--     estado 'PUBLICADO' es el literal que escribe la API.
-- ------------------------------------------------------------
INSERT INTO vacante (id, id_empresa, titulo, salario, modalidad, nivel_experiencia, descripcion_tecnica, estado, created_at) VALUES
  ('30000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Desarrollador Backend Junior', 4500.00, 'HIBRIDO', 'JUNIOR', 'Desarrollo de APIs REST con Node.js, TypeScript y PostgreSQL. Se requiere manejo de Git y pruebas unitarias.', 'PUBLICADO', NOW()),
  ('30000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Analista de Datos', 5200.00, 'REMOTO', 'SEMI_SENIOR', 'Análisis de datos con Python y SQL, construcción de reportes y apoyo a la toma de decisiones con métricas de negocio.', 'PUBLICADO', NOW())
ON CONFLICT (id) DO UPDATE SET
  nivel_experiencia   = EXCLUDED.nivel_experiencia,
  descripcion_tecnica = EXCLUDED.descripcion_tecnica;

-- ------------------------------------------------------------
-- 11. Eventos (POST /api/events)
--     La API guarda estado en minúsculas y el catálogo público muestra los
--     publicados con fecha_fin futura; por eso las fechas se calculan desde
--     NOW() para que el demo nunca expire.
-- ------------------------------------------------------------
INSERT INTO evento (id, id_usuario, titulo, descripcion, fecha_inicio, fecha_fin, cupo_maximo, ubicacion, estado, imagen_url, fecha_creacion) VALUES
  ('31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'Charla: Cloud para titulados', 'Introducción a servicios en la nube y buenas prácticas de despliegue.', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '2 hours', 40, 'Auditorio Facultad de Ciencias y Tecnología', 'publicado', NULL, NOW()),
  ('31000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Taller de entrevistas técnicas', 'Simulacros de entrevista y revisión de CV con mentores de la comunidad.', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days' + INTERVAL '3 hours', 25, 'Aula Magna de Sistemas', 'publicado', NULL, NOW()),
  ('31000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'Feria de empleo UMSS 2026', 'Borrador de la feria anual con empresas de tecnología.', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '6 hours', 120, 'Cancha central UMSS', 'borrador', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 12. Solicitudes de titulación (épica 8: bandeja de validación y reportes)
--     Mezcla de estados y antigüedades: una pendiente vencida (más de 48 h),
--     una reciente, observadas, aprobadas y rechazadas.
--     NO usar estos ci / correo / cod_sis para registrar una solicitud nueva
--     (la validación de duplicados los rechazaría).
-- ------------------------------------------------------------
INSERT INTO detalle_solicitud (id, id_carrera, nombre, apellido, telefono, email, fecha_titulacion, fecha_ingreso, ci, extension_ci, anio_egreso, cod_sis, desea_mentor) VALUES
  ('41000000-0000-4000-8000-000000000001', '94c12c08-2743-40c2-a75a-6818391091b8', 'Ana', 'Torres Rojas', '71234567', 'ana.torres.demo@gmail.com', '2021-06-15', '2016-03-01', '71234567', 'CB', 2021, 201904511, TRUE),
  ('41000000-0000-4000-8000-000000000002', '94c12c08-2743-40c2-a75a-6818391091b8', 'Marco', 'Antonio Villarroel', '76543210', 'marco.villarroel.demo@umss.edu.bo', '2019-11-20', '2014-08-01', '6987654', 'LP', 2019, 201602201, FALSE),
  ('41000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Lucía', 'Fernández Pinto', '70112233', 'lucia.fernandez.demo@outlook.com', '2022-07-08', '2017-08-01', '8456123', 'SC', 2022, 201903311, TRUE),
  ('41000000-0000-4000-8000-000000000004', '94c12c08-2743-40c2-a75a-6818391091b8', 'René', 'Calvo Quiroga', '77553311', 'rene.calvo.demo@gmail.com', '2018-05-30', '2013-08-01', '5632147', 'TJ', 2018, 201501123, FALSE),
  ('41000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'Fabiola', 'Aguilar Soto', '70998877', 'fabiola.aguilar.demo@gmail.com', '2023-06-20', '2018-08-01', '9123456', 'CB', 2023, 202001122, TRUE),
  ('41000000-0000-4000-8000-000000000006', '94c12c08-2743-40c2-a75a-6818391091b8', 'Diego', 'Vargas Camacho', '72884411', 'diego.vargas.demo@umss.edu.bo', '2020-12-11', '2015-08-01', '7456123', 'PT', 2020, 201703345, FALSE),
  ('41000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'Paola', 'Ríos Fernández', '76112244', 'paola.rios.demo@gmail.com', '2021-08-27', '2016-08-01', '6321458', 'OR', 2021, 201802233, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO documento_respaldo (id, id_tipo_archivo, tamanio_mb, ruta_storage, fecha_creacion, es_valido) VALUES
  ('42000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 2, 'solicitudes/demo/ana-torres.pdf', NOW() - INTERVAL '5 hours', FALSE),
  ('42000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000001', 3, 'solicitudes/demo/marco-villarroel.pdf', NOW() - INTERVAL '72 hours', FALSE),
  ('42000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000001', 2, 'solicitudes/demo/lucia-fernandez.pdf', NOW() - INTERVAL '30 hours', TRUE),
  ('42000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000001', 4, 'solicitudes/demo/rene-calvo.pdf', NOW() - INTERVAL '100 hours', TRUE),
  ('42000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000001', 2, 'solicitudes/demo/fabiola-aguilar.pdf', NOW() - INTERVAL '120 hours', TRUE),
  ('42000000-0000-4000-8000-000000000006', '21000000-0000-4000-8000-000000000001', 3, 'solicitudes/demo/diego-vargas.pdf', NOW() - INTERVAL '150 hours', TRUE),
  ('42000000-0000-4000-8000-000000000007', '21000000-0000-4000-8000-000000000001', 2, 'solicitudes/demo/paola-rios.pdf', NOW() - INTERVAL '160 hours', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitud (id, id_detalle_solicitud, id_documento_respaldo, estado, fecha_creacion) VALUES
  ('43000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', 'Pendiente', NOW() - INTERVAL '5 hours'),
  ('43000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', 'Pendiente', NOW() - INTERVAL '72 hours'),
  ('43000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000003', '42000000-0000-4000-8000-000000000003', 'OBSERVED', NOW() - INTERVAL '30 hours'),
  ('43000000-0000-4000-8000-000000000004', '41000000-0000-4000-8000-000000000004', '42000000-0000-4000-8000-000000000004', 'APPROVED', NOW() - INTERVAL '100 hours'),
  ('43000000-0000-4000-8000-000000000005', '41000000-0000-4000-8000-000000000005', '42000000-0000-4000-8000-000000000005', 'REJECTED', NOW() - INTERVAL '120 hours'),
  ('43000000-0000-4000-8000-000000000006', '41000000-0000-4000-8000-000000000006', '42000000-0000-4000-8000-000000000006', 'verificado', NOW() - INTERVAL '150 hours'),
  ('43000000-0000-4000-8000-000000000007', '41000000-0000-4000-8000-000000000007', '42000000-0000-4000-8000-000000000007', 'observado', NOW() - INTERVAL '160 hours')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 13. Solicitudes de la bandeja de validación (demo de la HU-04)
--     Son los 15 expedientes que trae supabase/seed-hu4-demo.sql, ahora con
--     UUID fijo y carrera resuelta por id (el archivo original la buscaba con
--     ILIKE ... LIMIT 1, lo que podía dar resultados distintos en cada base).
--     Antigüedades: pendientes vencidas (más de 48 h), pendientes recientes,
--     observadas, aprobadas y rechazadas.
-- ------------------------------------------------------------
INSERT INTO detalle_solicitud (id, id_carrera, nombre, apellido, telefono, email, fecha_titulacion, fecha_ingreso, ci, extension_ci, anio_egreso, cod_sis, desea_mentor) VALUES
  ('45000000-0000-4000-8000-000000000001', '94c12c08-2743-40c2-a75a-6818391091b8', 'Alejandro', 'Rojas Torrico', '71234567', 'alejandro.rojas@gmail.com', NULL, NULL, '6849201', NULL, 2020, 201804921, NULL),
  ('45000000-0000-4000-8000-000000000002', '94c12c08-2743-40c2-a75a-6818391091b8', 'Carla Beatriz', 'Montaño', '76543210', 'c.montano@est.umss.edu', NULL, NULL, '7942105', NULL, 2019, 201701234, NULL),
  ('45000000-0000-4000-8000-000000000003', '94c12c08-2743-40c2-a75a-6818391091b8', 'Jorge', 'Morales Villarroel', '77441122', 'jorge.mv@gmail.com', NULL, NULL, '4720918', NULL, 2018, 201602119, NULL),
  ('45000000-0000-4000-8000-000000000004', '94c12c08-2743-40c2-a75a-6818391091b8', 'Mauricio Fernando', 'Claros', '78889900', 'm.claros@est.umss.edu', NULL, NULL, '5294021', NULL, 2021, 201904581, NULL),
  ('45000000-0000-4000-8000-000000000005', '94c12c08-2743-40c2-a75a-6818391091b8', 'Mariana', 'Bustamante Paz', '70112233', 'mariana.bp@outlook.com', NULL, NULL, '8412954', NULL, 2021, 201903310, NULL),
  ('45000000-0000-4000-8000-000000000006', '94c12c08-2743-40c2-a75a-6818391091b8', 'Valeria', 'Gonzales Mercado', '79998877', 'valeria.gonzales@gmail.com', NULL, NULL, '7930114', NULL, 2020, 201901184, NULL),
  ('45000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'Diego', 'Paredes Claure', '71001020', 'diego.pc@gmail.com', NULL, NULL, '6543210', NULL, 2022, 202001455, NULL),
  ('45000000-0000-4000-8000-000000000008', '94c12c08-2743-40c2-a75a-6818391091b8', 'Lucía', 'Quispe Mamani', '73040506', 'lucia.qm@est.umss.edu', NULL, NULL, '7890123', NULL, 2023, 202102233, NULL),
  ('45000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'Marco', 'Terrazas Lopez', '75060708', 'marco.tl@gmail.com', NULL, NULL, '8901234', NULL, 2021, 201905544, NULL),
  ('45000000-0000-4000-8000-000000000010', '94c12c08-2743-40c2-a75a-6818391091b8', 'Rosa', 'Aguilar Siles', '77080910', 'rosa.as@est.umss.edu', NULL, NULL, '9012345', NULL, 2019, 201806677, NULL),
  ('45000000-0000-4000-8000-000000000011', '94c12c08-2743-40c2-a75a-6818391091b8', 'Paola', 'Vargas Hurtado', '79101112', 'paola.vh@gmail.com', NULL, NULL, '6123456', NULL, 2022, 202003889, NULL),
  ('45000000-0000-4000-8000-000000000012', '94c12c08-2743-40c2-a75a-6818391091b8', 'Carlos', 'Mendez Roca', '71121314', 'carlos.mr@est.umss.edu', NULL, NULL, '7234567', NULL, 2018, 201707990, NULL),
  ('45000000-0000-4000-8000-000000000013', '94c12c08-2743-40c2-a75a-6818391091b8', 'Sofía', 'Reyes Camacho', '73141516', 'sofia.rc@gmail.com', NULL, NULL, '8345678', NULL, 2023, 202104101, NULL),
  ('45000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000002', 'Andrés', 'López Ferreira', '75161718', 'andres.lf@est.umss.edu', NULL, NULL, '9456789', NULL, 2017, 201608212, NULL),
  ('45000000-0000-4000-8000-000000000015', '94c12c08-2743-40c2-a75a-6818391091b8', 'Elena', 'Torrez Gutiérrez', '77181920', 'elena.tg@gmail.com', NULL, NULL, '5678901', '1A', 2024, 202205323, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO documento_respaldo (id, id_tipo_archivo, tamanio_mb, ruta_storage, fecha_creacion, es_valido) VALUES
  ('46000000-0000-4000-8000-000000000001', NULL, 2, 'demo/6849201.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000002', NULL, 2, 'demo/7942105.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000003', NULL, 2, 'demo/4720918.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000004', NULL, 2, 'demo/5294021.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000005', NULL, 2, 'demo/8412954.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000006', NULL, 2, 'demo/7930114.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000007', NULL, 2, 'demo/6543210.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000008', NULL, 2, 'demo/7890123.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000009', NULL, 2, 'demo/8901234.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000010', NULL, 2, 'demo/9012345.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000011', NULL, 2, 'demo/6123456.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000012', NULL, 2, 'demo/7234567.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000013', NULL, 2, 'demo/8345678.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000014', NULL, 2, 'demo/9456789.pdf', NOW(), FALSE),
  ('46000000-0000-4000-8000-000000000015', NULL, 2, 'demo/5678901.pdf', NOW(), FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitud (id, id_detalle_solicitud, id_documento_respaldo, estado, fecha_creacion) VALUES
  ('47000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '46000000-0000-4000-8000-000000000001', 'Pendiente', NOW() - INTERVAL '54 hours'),
  ('47000000-0000-4000-8000-000000000002', '45000000-0000-4000-8000-000000000002', '46000000-0000-4000-8000-000000000002', 'Pendiente', NOW() - INTERVAL '49 hours'),
  ('47000000-0000-4000-8000-000000000003', '45000000-0000-4000-8000-000000000003', '46000000-0000-4000-8000-000000000003', 'Pendiente', NOW() - INTERVAL '72 hours'),
  ('47000000-0000-4000-8000-000000000004', '45000000-0000-4000-8000-000000000004', '46000000-0000-4000-8000-000000000004', 'Pendiente', NOW() - INTERVAL '14 hours'),
  ('47000000-0000-4000-8000-000000000005', '45000000-0000-4000-8000-000000000005', '46000000-0000-4000-8000-000000000005', 'Pendiente', NOW() - INTERVAL '32 hours'),
  ('47000000-0000-4000-8000-000000000006', '45000000-0000-4000-8000-000000000006', '46000000-0000-4000-8000-000000000006', 'Pendiente', NOW() - INTERVAL '26 hours'),
  ('47000000-0000-4000-8000-000000000007', '45000000-0000-4000-8000-000000000007', '46000000-0000-4000-8000-000000000007', 'Pendiente', NOW() - INTERVAL '6 hours'),
  ('47000000-0000-4000-8000-000000000008', '45000000-0000-4000-8000-000000000008', '46000000-0000-4000-8000-000000000008', 'Pendiente', NOW() - INTERVAL '5 hours'),
  ('47000000-0000-4000-8000-000000000009', '45000000-0000-4000-8000-000000000009', '46000000-0000-4000-8000-000000000009', 'Pendiente', NOW() - INTERVAL '50 hours'),
  ('47000000-0000-4000-8000-000000000010', '45000000-0000-4000-8000-000000000010', '46000000-0000-4000-8000-000000000010', 'Pendiente', NOW() - INTERVAL '10 hours'),
  ('47000000-0000-4000-8000-000000000011', '45000000-0000-4000-8000-000000000011', '46000000-0000-4000-8000-000000000011', 'OBSERVED', NOW() - INTERVAL '30 hours'),
  ('47000000-0000-4000-8000-000000000012', '45000000-0000-4000-8000-000000000012', '46000000-0000-4000-8000-000000000012', 'OBSERVED', NOW() - INTERVAL '55 hours'),
  ('47000000-0000-4000-8000-000000000013', '45000000-0000-4000-8000-000000000013', '46000000-0000-4000-8000-000000000013', 'APPROVED', NOW() - INTERVAL '90 hours'),
  ('47000000-0000-4000-8000-000000000014', '45000000-0000-4000-8000-000000000014', '46000000-0000-4000-8000-000000000014', 'REJECTED', NOW() - INTERVAL '100 hours'),
  ('47000000-0000-4000-8000-000000000015', '45000000-0000-4000-8000-000000000015', '46000000-0000-4000-8000-000000000015', 'Pendiente', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Dictámenes de las solicitudes ya resueltas (misma forma que escribe la API:
-- categoría y nota separadas por una línea en blanco).
INSERT INTO dictamen (id, id_administrador_sistema, id_solicitud, justificacion, fecha_creacion, fecha_actualizacion, subsanada) VALUES
  ('44000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000003', 'DOCUMENTO ILEGIBLE

El documento adjunto no permite verificar el sello de la facultad.', NOW() - INTERVAL '20 hours', CURRENT_DATE, FALSE),
  ('44000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000004', 'DOCUMENTO VÁLIDO

Toda la documentación está completa y legible.', NOW() - INTERVAL '90 hours', CURRENT_DATE, FALSE),
  ('44000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000005', 'DATOS NO COINCIDEN

El nombre del documento no coincide con el registrado.', NOW() - INTERVAL '110 hours', CURRENT_DATE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 14. Titulado del perfil de demostración (épicas 2 y 7)
--     Es el perfil que usa TITULADO_ID_PRUEBA (apps/api/.env.example) y las
--     pantallas de perfil y mentoría. Se reutilizan los UUID que ya estaban en
--     la BD en la nube para no duplicar filas allí.
-- ------------------------------------------------------------
INSERT INTO usuario (usuario_id, nombre, rol) VALUES
  ('9568d93d-5a2f-4c92-838a-d1fd2e158ba0', 'María Fernanda Rojas', 'titulado')
ON CONFLICT (usuario_id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO titulado (id, id_usuario, nombre, apellido, cod_sis, id_carrera, ci, extension_ci, anio_ingreso, grado) VALUES
  ('9bab2c02-d99b-4e06-a16c-ba5ee762654e', '9568d93d-5a2f-4c92-838a-d1fd2e158ba0', 'María Fernanda', 'Rojas Vargas', 201812345, '94c12c08-2743-40c2-a75a-6818391091b8', '7654321', 'CB', 2018, 'Licenciatura')
ON CONFLICT (id) DO NOTHING;

INSERT INTO formacion_academica (id, id_titulado, institucion, titulo, grado, anio_egreso, fecha_creacion) VALUES
  ('5049fc15-44db-4442-b227-8511f6911bf4', '9bab2c02-d99b-4e06-a16c-ba5ee762654e', 'Universidad Mayor de San Simón', 'Licenciatura en Ingeniería de Sistemas', 'Licenciatura', 2023, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO experiencia_laboral (id, id_titulado, empresa, cargo, fecha_inicio, fecha_fin, fecha_creacion) VALUES
  ('05d24c34-991a-421e-a20b-892a5a5ffffe', '9bab2c02-d99b-4e06-a16c-ba5ee762654e', 'Jala Soft', 'Desarrolladora Backend Jr.', '2023-03-01', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO certificacion (id, id_titulado, nombre, entidad_emisora, grado, anio_emision, fecha_creacion) VALUES
  ('0b3bdf42-969e-4449-b5aa-724246dfafe9', '9bab2c02-d99b-4e06-a16c-ba5ee762654e', 'AWS Certified Cloud Practitioner', 'Amazon Web Services', 'Fundamental', 2024, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO certificacion_respaldo (id, id_certificacion, tipo, archivo_key, fecha_subida) VALUES
  ('e2f2a643-bd63-460f-8c97-522f53cde43a', '0b3bdf42-969e-4449-b5aa-724246dfafe9', 'DOCUMENTO', 'certificaciones/ejemplo/aws-ccp.pdf', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
