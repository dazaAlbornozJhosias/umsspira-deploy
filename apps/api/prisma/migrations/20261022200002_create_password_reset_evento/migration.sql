 

CREATE TABLE public.password_reset_evento (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          uuid REFERENCES public.usuario(usuario_id) ON DELETE SET NULL,
  correo_normalizado  varchar(255),
  tipo                varchar(30) NOT NULL
    CHECK (tipo IN (
      'solicitud','enlace_enviado','enlace_abierto','password_cambiada',
      'enlace_vencido','enlace_reutilizado','enlace_revocado',
      'error_smtp','error_supabase'
    )),
  metadata            jsonb,
  creado_en           timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_pre_usuario ON public.password_reset_evento (usuario_id, creado_en DESC);
CREATE INDEX idx_pre_correo  ON public.password_reset_evento (correo_normalizado, creado_en DESC);
 