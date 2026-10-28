
CREATE TABLE public.password_reset_solicitud (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correo_normalizado  varchar(255) NOT NULL,
  origen_hash         varchar(64)  NOT NULL,
  usuario_id          uuid REFERENCES public.usuario(usuario_id) ON DELETE SET NULL,
  resultado           varchar(30)  NOT NULL DEFAULT 'solicitado'
    CHECK (resultado IN (
      'solicitado','enviado',
      'rechazado_rate','rechazado_inactivo','rechazado_no_existe',
      'error_smtp','error_supabase'
    )),
  creado_en           timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_prs_correo_ventana ON public.password_reset_solicitud (correo_normalizado, creado_en DESC);
CREATE INDEX idx_prs_origen_ventana ON public.password_reset_solicitud (origen_hash, creado_en DESC);
 