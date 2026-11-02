BEGIN;

-- Evita dejar bloqueado el servicio si otra transacción está usando estas tablas.
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

ALTER TABLE public.empresa_invitacion
    ADD COLUMN nombre VARCHAR(120);

-- Las fechas anteriores permanecen intactas; no se inventan fechas históricas.
ALTER TABLE public.vacante
    ADD COLUMN fecha_publicacion TIMESTAMPTZ(6),
    ADD COLUMN fecha_cierre TIMESTAMPTZ(6),
    ADD COLUMN fecha_actualizacion TIMESTAMPTZ(6);

ALTER TABLE public.vacante
    ADD CONSTRAINT chk_e4_vacante_salario
    CHECK (salario IS NULL OR salario >= 0) NOT VALID;

CREATE INDEX idx_e4_vacante_publicacion
    ON public.vacante(id_empresa, fecha_publicacion DESC);
CREATE INDEX idx_e4_vacante_estado
    ON public.vacante(id_empresa, estado);
CREATE INDEX idx_e4_vacante_filtros
    ON public.vacante(id_empresa, modalidad, nivel_experiencia);
CREATE INDEX idx_e4_postulacion_vacante_estado
    ON public.postulacion(id_vacante, estado);

CREATE FUNCTION public.fn_e4_control_vacante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF UPPER(TRIM(COALESCE(OLD.estado, ''))) = 'CERRADA'
           AND UPPER(TRIM(COALESCE(NEW.estado, ''))) <> 'CERRADA'
        THEN
            RAISE EXCEPTION 'No se puede reabrir una vacante cerrada';
        END IF;
    END IF;

    -- PUBLICADO es el estado actual; PUBLICADA conserva compatibilidad con la réplica.
    IF UPPER(TRIM(COALESCE(NEW.estado, ''))) IN ('PUBLICADO', 'PUBLICADA')
       AND NEW.fecha_publicacion IS NULL
    THEN
        NEW.fecha_publicacion := NOW();
    END IF;

    IF UPPER(TRIM(COALESCE(NEW.estado, ''))) = 'CERRADA' THEN
        NEW.fecha_cierre := COALESCE(NEW.fecha_cierre, NOW());
    END IF;

    NEW.fecha_actualizacion := NOW();
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.fn_e4_validar_postulacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_estado VARCHAR;
BEGIN
    -- Coordina nuevas postulaciones con el cierre concurrente de la vacante.
    SELECT estado INTO v_estado
    FROM public.vacante
    WHERE id = NEW.id_vacante
    FOR SHARE;

    IF UPPER(TRIM(COALESCE(v_estado, ''))) = 'CERRADA' THEN
        RAISE EXCEPTION 'No se permiten postulaciones a vacantes cerradas';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_e4_control_vacante
    BEFORE INSERT OR UPDATE ON public.vacante
    FOR EACH ROW EXECUTE FUNCTION public.fn_e4_control_vacante();

CREATE TRIGGER trg_e4_validar_postulacion
    BEFORE INSERT OR UPDATE OF id_vacante ON public.postulacion
    FOR EACH ROW EXECUTE FUNCTION public.fn_e4_validar_postulacion();

COMMIT;
