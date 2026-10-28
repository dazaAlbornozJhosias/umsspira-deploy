-- 1. Token de recuperación (CA-12.3, CA-12.5)
CREATE TABLE public.password_reset_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario  uuid NOT NULL REFERENCES public.usuario(usuario_id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expira_en   timestamptz NOT NULL,
  usado_en    timestamptz,
  revocado    boolean NOT NULL DEFAULT false,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_prt_expira_futuro    CHECK (expira_en > creado_en),
  CONSTRAINT chk_prt_vigencia_max_60m CHECK (expira_en <= creado_en + interval '60 minutes')
);
 
CREATE INDEX idx_prt_usuario ON public.password_reset_token (id_usuario, creado_en DESC);
 
-- Un solo token activo por usuario (no usado, no revocado)
CREATE UNIQUE INDEX uq_prt_activo_por_usuario
  ON public.password_reset_token (id_usuario)
  WHERE usado_en IS NULL AND revocado = false;
 


