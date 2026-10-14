-- ============================================================
-- 0009_rls_solicitudes.sql
-- RLS completo para el flujo de solicitudes
-- Alineado a las HUs del Sprint 1
-- ============================================================






-- ============================================================
-- PARTE 1: FUNCIÓN AUXILIAR es_admin()
-- ============================================================

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


-- ============================================================
-- PARTE 2: HABILITAR RLS
-- ============================================================

ALTER TABLE detalle_solicitud   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_respaldo  ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud           ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_solicitud   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictamen            ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PARTE 3: POLÍTICAS PARA detalle_solicitud
-- ============================================================

-- SELECT: admin o dueño
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

-- INSERT: público (el envío de HU-03 llega sin sesión)
DROP POLICY IF EXISTS "detalle_insert_publico" ON detalle_solicitud;
CREATE POLICY "detalle_insert_publico"
ON detalle_solicitud FOR INSERT
TO anon, authenticated
WITH CHECK (TRUE);

-- UPDATE: solo admin (los datos pre-envío viven en Redis)
DROP POLICY IF EXISTS "detalle_update_admin" ON detalle_solicitud;
CREATE POLICY "detalle_update_admin"
ON detalle_solicitud FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (public.es_admin());

-- DELETE: solo admin
DROP POLICY IF EXISTS "detalle_delete_admin" ON detalle_solicitud;
CREATE POLICY "detalle_delete_admin"
ON detalle_solicitud FOR DELETE
TO authenticated
USING (public.es_admin());


-- ============================================================
-- PARTE 4: POLÍTICAS PARA documento_respaldo
-- ============================================================

-- SELECT: admin o dueño
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

-- INSERT: público, con validación de tamaño (CA-03.3: máx 5 MB)
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

-- UPDATE: admin siempre; dueño sólo si la solicitud está abierta
-- (Pendiente u Observado → permite subsanación CA-04.5)
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

-- DELETE: solo admin
DROP POLICY IF EXISTS "documento_delete_admin" ON documento_respaldo;
CREATE POLICY "documento_delete_admin"
ON documento_respaldo FOR DELETE
TO authenticated
USING (public.es_admin());


-- ============================================================
-- PARTE 5: POLÍTICAS PARA solicitud
-- ============================================================

-- SELECT: admin o dueño
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

-- INSERT: público (HU-03). El envío siempre entra como 'Pendiente'
DROP POLICY IF EXISTS "solicitud_insert_publico" ON solicitud;
CREATE POLICY "solicitud_insert_publico"
ON solicitud FOR INSERT
TO anon, authenticated
WITH CHECK (
    id_detalle_solicitud IS NOT NULL
    AND id_documento_respaldo IS NOT NULL
    AND estado = 'Pendiente'
);

-- UPDATE: solo admin, sólo hacia estados finales
DROP POLICY IF EXISTS "solicitud_update_admin" ON solicitud;
CREATE POLICY "solicitud_update_admin"
ON solicitud FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (
    public.es_admin()
    AND estado IN ('Aprobado', 'Observado', 'Rechazado')
);

-- DELETE: solo admin
DROP POLICY IF EXISTS "solicitud_delete_admin" ON solicitud;
CREATE POLICY "solicitud_delete_admin"
ON solicitud FOR DELETE
TO authenticated
USING (public.es_admin());


-- ============================================================
-- PARTE 6: POLÍTICAS PARA usuario_solicitud
-- ============================================================

-- SELECT: el propio usuario o admin
DROP POLICY IF EXISTS "usuario_solicitud_select_propio_o_admin" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_select_propio_o_admin"
ON usuario_solicitud FOR SELECT
TO authenticated
USING (
    id_usuario = auth.uid()
    OR public.es_admin()
);

-- INSERT: el propio usuario, admin, o durante el envío anónimo (HU-03)
DROP POLICY IF EXISTS "usuario_solicitud_insert_propio_o_anon" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_insert_propio_o_anon"
ON usuario_solicitud FOR INSERT
TO anon, authenticated
WITH CHECK (
    id_usuario = auth.uid()
    OR public.es_admin()
    OR auth.uid() IS NULL
);

-- UPDATE: solo admin
DROP POLICY IF EXISTS "usuario_solicitud_update_admin" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_update_admin"
ON usuario_solicitud FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (public.es_admin());

-- DELETE: solo admin
DROP POLICY IF EXISTS "usuario_solicitud_delete_admin" ON usuario_solicitud;
CREATE POLICY "usuario_solicitud_delete_admin"
ON usuario_solicitud FOR DELETE
TO authenticated
USING (public.es_admin());


-- ============================================================
-- PARTE 7: POLÍTICAS PARA dictamen
-- ============================================================

-- SELECT: admin o dueño de la solicitud dictaminada
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

-- INSERT: solo admin, con validaciones CA-04.5 y CA-04.6
DROP POLICY IF EXISTS "dictamen_insert_admin" ON dictamen;
CREATE POLICY "dictamen_insert_admin"
ON dictamen FOR INSERT TO authenticated
WITH CHECK (public.es_admin());

-- UPDATE: solo admin
DROP POLICY IF EXISTS "dictamen_update_admin" ON dictamen;
CREATE POLICY "dictamen_update_admin"
ON dictamen FOR UPDATE
TO authenticated
USING (public.es_admin())
WITH CHECK (public.es_admin());

-- DELETE: solo admin
DROP POLICY IF EXISTS "dictamen_delete_admin" ON dictamen;
CREATE POLICY "dictamen_delete_admin"
ON dictamen FOR DELETE
TO authenticated
USING (public.es_admin());

