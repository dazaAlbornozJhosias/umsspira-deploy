CREATE TABLE public.password_reset_correo (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_token              uuid NOT NULL REFERENCES public.password_reset_token(id) ON DELETE CASCADE,
  email_destino         varchar(255) NOT NULL,
  asunto                varchar(255) NOT NULL,
  cuerpo                text,
  estado                varchar(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','enviada','fallida')),
  intentos              smallint NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  max_intentos          smallint NOT NULL DEFAULT 3 CHECK (max_intentos BETWEEN 1 AND 10),
  siguiente_intento_en  timestamptz NOT NULL DEFAULT now(),
  smtp_message_id       varchar(255),
  ultimo_error          text,
  fecha_envio           timestamptz,
  creado_en             timestamptz NOT NULL DEFAULT now(),
  actualizado_en        timestamptz NOT NULL DEFAULT now()
);
 
-- Un solo correo por token (idempotencia)
CREATE UNIQUE INDEX uq_prc_un_correo_por_token ON public.password_reset_correo (id_token);
 
CREATE INDEX idx_prc_pendientes ON public.password_reset_correo (estado, siguiente_intento_en)
  WHERE estado = 'pendiente';