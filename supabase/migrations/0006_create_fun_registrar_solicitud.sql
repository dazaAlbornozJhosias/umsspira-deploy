-- ============================================================
-- 0006_create_fun_registrar_solicitud.sql
-- Registra una nueva solicitud completa (autónoma)
-- El egresado puede no estar autenticado (registro público HU-03)
-- ============================================================

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
    p_expedido_en       VARCHAR(20),
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
    -- Validaciones mínimas
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

    -- 1. Insertar detalle_solicitud
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

    -- 2. Insertar documento_respaldo
    INSERT INTO documento_respaldo (
        id_tipo_archivo, tamanio_mb, ruta_storage, fecha_creacion, es_valido
    ) VALUES (
        p_id_tipo_archivo, p_tamanio_mb, p_ruta_storage, NOW(), FALSE
    )
    RETURNING id INTO v_id_documento;

    -- 3. Insertar solicitud en estado inicial
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

COMMENT ON FUNCTION fun_registrar_solicitud(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DATE, DATE,
    VARCHAR, VARCHAR, VARCHAR, SMALLINT, NUMERIC, BOOLEAN,
    UUID, INTEGER, TEXT
) IS 'Registra una nueva solicitud desde el registro publico (HU-03)';