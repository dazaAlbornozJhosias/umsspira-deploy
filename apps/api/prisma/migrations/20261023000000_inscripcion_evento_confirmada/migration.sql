CREATE UNIQUE INDEX "inscripcion_evento_confirmada_evento_usuario_key"
  ON "inscripcion_evento" ("id_evento", "id_usuario")
  WHERE "estado" = 'CONFIRMADA';

CREATE INDEX "inscripcion_evento_confirmada_evento_idx"
  ON "inscripcion_evento" ("id_evento")
  WHERE "estado" = 'CONFIRMADA';
