BEGIN;

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
          AND estado = 'APPROVED'
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
