-- ============================================================
-- 0005_create_fun_existe_solicitud_activa.sql
-- Detecta si ya existe una solicitud activa con el mismo CI, email o cod_sis
-- CA-01.4: bloquear duplicados si la solicitud previa no fue RECHAZADA
-- CA-01.5: si la previa fue RECHAZADA, permitir registrar de nuevo
-- ============================================================

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
       WHERE LOWER(s.estado) NOT IN ('rechazado', 'rechazada')  -- CA-01.5
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

COMMENT ON FUNCTION fun_existe_solicitud_activa(VARCHAR, VARCHAR, VARCHAR, NUMERIC)
IS 'Detecta solicitudes activas duplicadas por CI, email o cod_sis (CA-01.4, CA-01.5)';