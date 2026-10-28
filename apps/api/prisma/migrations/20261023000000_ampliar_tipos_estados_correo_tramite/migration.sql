BEGIN;

ALTER TABLE public.correo_tramite
  DROP CONSTRAINT IF EXISTS correo_tramite_tipo_check,
  DROP CONSTRAINT IF EXISTS correo_tramite_estado_check,
  ADD CONSTRAINT correo_tramite_tipo_check
    CHECK (tipo IN (
      'recepcion', 'aprobacion', 'observacion', 'rechazo',
      'otp', 'subsanacion', 'recuperacion'
    )),
  ADD CONSTRAINT correo_tramite_estado_check
    CHECK (estado IN ('pendiente', 'procesando', 'enviada', 'fallida'));

COMMIT;
