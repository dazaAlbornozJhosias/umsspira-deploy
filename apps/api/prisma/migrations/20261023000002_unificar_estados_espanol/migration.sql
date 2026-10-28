BEGIN;

UPDATE public.solicitud AS solicitud
SET estado = traduccion.nuevo
FROM (VALUES
  ('PENDING', 'PENDIENTE'), ('PENDIENTE', 'PENDIENTE'),
  ('APPROVED', 'APROBADA'), ('APROBADO', 'APROBADA'), ('APROBADA', 'APROBADA'),
  ('OBSERVED', 'OBSERVADA'), ('OBSERVADO', 'OBSERVADA'), ('OBSERVADA', 'OBSERVADA'),
  ('REJECTED', 'RECHAZADA'), ('RECHAZADO', 'RECHAZADA'), ('RECHAZADA', 'RECHAZADA')
) AS traduccion(anterior, nuevo)
WHERE upper(btrim(solicitud.estado)) = traduccion.anterior
  AND solicitud.estado IS DISTINCT FROM traduccion.nuevo;

UPDATE public.dictamen AS dictamen
SET decision = traduccion.nuevo
FROM (VALUES
  ('APPROVED', 'APROBADA'), ('APROBADO', 'APROBADA'), ('APROBADA', 'APROBADA'),
  ('OBSERVED', 'OBSERVADA'), ('OBSERVADO', 'OBSERVADA'), ('OBSERVADA', 'OBSERVADA'),
  ('REJECTED', 'RECHAZADA'), ('RECHAZADO', 'RECHAZADA'), ('RECHAZADA', 'RECHAZADA')
) AS traduccion(anterior, nuevo)
WHERE upper(btrim(dictamen.decision)) = traduccion.anterior
  AND dictamen.decision IS DISTINCT FROM traduccion.nuevo;

UPDATE public.auditoria_dictamen AS auditoria
SET estado_anterior = traduccion.nuevo
FROM (VALUES
  ('PENDING', 'PENDIENTE'), ('PENDIENTE', 'PENDIENTE'),
  ('APPROVED', 'APROBADA'), ('APROBADO', 'APROBADA'), ('APROBADA', 'APROBADA'),
  ('OBSERVED', 'OBSERVADA'), ('OBSERVADO', 'OBSERVADA'), ('OBSERVADA', 'OBSERVADA'),
  ('REJECTED', 'RECHAZADA'), ('RECHAZADO', 'RECHAZADA'), ('RECHAZADA', 'RECHAZADA')
) AS traduccion(anterior, nuevo)
WHERE upper(btrim(auditoria.estado_anterior)) = traduccion.anterior
  AND auditoria.estado_anterior IS DISTINCT FROM traduccion.nuevo;

UPDATE public.auditoria_dictamen AS auditoria
SET estado_nuevo = traduccion.nuevo
FROM (VALUES
  ('PENDING', 'PENDIENTE'), ('PENDIENTE', 'PENDIENTE'),
  ('APPROVED', 'APROBADA'), ('APROBADO', 'APROBADA'), ('APROBADA', 'APROBADA'),
  ('OBSERVED', 'OBSERVADA'), ('OBSERVADO', 'OBSERVADA'), ('OBSERVADA', 'OBSERVADA'),
  ('REJECTED', 'RECHAZADA'), ('RECHAZADO', 'RECHAZADA'), ('RECHAZADA', 'RECHAZADA')
) AS traduccion(anterior, nuevo)
WHERE upper(btrim(auditoria.estado_nuevo)) = traduccion.anterior
  AND auditoria.estado_nuevo IS DISTINCT FROM traduccion.nuevo;

UPDATE public.disponibilidad_mentor AS disponibilidad
SET estado = traduccion.nuevo
FROM (VALUES
  ('AVAILABLE', 'DISPONIBLE'), ('DISPONIBLE', 'DISPONIBLE'),
  ('PAUSED', 'EN_PAUSA'), ('PAUSADO', 'EN_PAUSA'), ('PAUSADA', 'EN_PAUSA'), ('EN_PAUSA', 'EN_PAUSA'),
  ('UNAVAILABLE', 'NO_DISPONIBLE'), ('NO_DISPONIBLE', 'NO_DISPONIBLE')
) AS traduccion(anterior, nuevo)
WHERE upper(btrim(disponibilidad.estado)) = traduccion.anterior
  AND disponibilidad.estado IS DISTINCT FROM traduccion.nuevo;

CREATE OR REPLACE FUNCTION public.fun_reservar_emision_otp(p_id_solicitud UUID)
RETURNS TABLE(
    out_generaciones SMALLINT,
    out_enfriamiento TIMESTAMPTZ,
    out_bloqueado    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v public.control_reenvio_otp%ROWTYPE;
    v_ahora TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.solicitud
        WHERE id = p_id_solicitud
          AND estado = 'APROBADA'
    ) THEN
        RAISE EXCEPTION 'La solicitud no esta aprobada.'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.control_reenvio_otp (id_solicitud)
    VALUES (p_id_solicitud)
    ON CONFLICT (id_solicitud) DO NOTHING;

    SELECT * INTO v
    FROM public.control_reenvio_otp
    WHERE id_solicitud = p_id_solicitud
    FOR UPDATE;

    IF v.bloqueado_hasta IS NOT NULL AND v_ahora < v.bloqueado_hasta THEN
        RAISE EXCEPTION 'Reenvio bloqueado hasta %', v.bloqueado_hasta
            USING ERRCODE = '22023';
    END IF;

    IF v.generaciones_ciclo = 10
       AND v.bloqueado_hasta IS NOT NULL
       AND v_ahora >= v.bloqueado_hasta THEN
        v.generaciones_ciclo := 0;
        v.nivel_bloqueo := 0;
        v.bloqueado_hasta := NULL;
        v.enfriamiento_hasta := NULL;
    END IF;

    IF v.enfriamiento_hasta IS NOT NULL AND v_ahora < v.enfriamiento_hasta THEN
        RAISE EXCEPTION 'Espera hasta % para pedir otro codigo.', v.enfriamiento_hasta
            USING ERRCODE = '22023';
    END IF;

    v.generaciones_ciclo := v.generaciones_ciclo + 1;
    v.enfriamiento_hasta := v_ahora + interval '30 seconds';

    IF v.generaciones_ciclo = 5 THEN
        v.nivel_bloqueo := 1;
        v.bloqueado_hasta := v_ahora + interval '15 minutes';
    ELSIF v.generaciones_ciclo = 10 THEN
        v.nivel_bloqueo := 2;
        v.bloqueado_hasta := v_ahora + interval '2 hours';
    ELSE
        v.bloqueado_hasta := NULL;
    END IF;

    UPDATE public.control_reenvio_otp c
    SET generaciones_ciclo = v.generaciones_ciclo,
        nivel_bloqueo      = v.nivel_bloqueo,
        enfriamiento_hasta = v.enfriamiento_hasta,
        bloqueado_hasta    = v.bloqueado_hasta,
        updated_at         = v_ahora
    WHERE c.id_solicitud = p_id_solicitud;

    RETURN QUERY
        SELECT v.generaciones_ciclo, v.enfriamiento_hasta, v.bloqueado_hasta;
END;
$$;

COMMIT;
