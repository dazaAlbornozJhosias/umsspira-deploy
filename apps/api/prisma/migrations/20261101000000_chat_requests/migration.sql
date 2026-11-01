BEGIN;
ALTER TABLE conversacion ADD COLUMN direct_key varchar(73);
ALTER TABLE participante_conversacion ADD COLUMN ultima_lectura timestamp(6);
ALTER TABLE mensaje ADD COLUMN client_id uuid, ADD COLUMN editado_en timestamp(6), ADD COLUMN eliminado_en timestamp(6);
ALTER TABLE mensaje ADD COLUMN archivo_nombre varchar(255), ADD COLUMN archivo_mime varchar(150), ADD COLUMN archivo_bytes bytea, ADD COLUMN archivo_tamano integer;

-- Consolidar parejas antiguas sin perder mensajes ni eliminar conversaciones históricas.
CREATE TEMP TABLE chat_pairs ON COMMIT DROP AS
SELECT c.id, string_agg(DISTINCT p.usuario_id::text, ':' ORDER BY p.usuario_id::text) AS pair
FROM conversacion c JOIN participante_conversacion p ON p.conversacion_id = c.id
WHERE c.tipo = 'directo' AND p.usuario_id IS NOT NULL
GROUP BY c.id HAVING count(DISTINCT p.usuario_id) = 2;
CREATE TEMP TABLE chat_canonical ON COMMIT DROP AS
SELECT id, pair, first_value(id) OVER (PARTITION BY pair ORDER BY id) AS canonical FROM chat_pairs;
UPDATE mensaje m SET id_conversacion = p.canonical FROM chat_canonical p WHERE m.id_conversacion = p.id AND p.id <> p.canonical;
UPDATE conversacion c SET tipo = 'directo_duplicado' FROM chat_canonical p WHERE c.id = p.id AND p.id <> p.canonical;
UPDATE conversacion c SET direct_key = p.pair, estado_conversacion = 'ACEPTADO',
  creado_por = COALESCE(c.creado_por, split_part(p.pair, ':', 1)::uuid),
  fecha_creacion = COALESCE(c.fecha_creacion, (SELECT min(fecha_mensaje) FROM mensaje WHERE id_conversacion = c.id), CURRENT_TIMESTAMP),
  fecha_actualizacion = COALESCE((SELECT max(fecha_mensaje) FROM mensaje WHERE id_conversacion = c.id), c.fecha_actualizacion, CURRENT_TIMESTAMP)
FROM chat_canonical p WHERE c.id = p.canonical;
UPDATE mensaje SET fecha_mensaje = CURRENT_TIMESTAMP WHERE fecha_mensaje IS NULL;
UPDATE participante_conversacion p SET ultima_lectura = (
  SELECT max(m.fecha_mensaje) FROM mensaje m WHERE m.id_conversacion = p.conversacion_id AND m.emisor_id <> p.usuario_id AND m.estado_envio = 'leido'
);
CREATE UNIQUE INDEX conversacion_direct_key_key ON conversacion(direct_key);
DELETE FROM participante_conversacion p USING participante_conversacion other
WHERE p.conversacion_id = other.conversacion_id AND p.usuario_id = other.usuario_id AND p.id > other.id;
CREATE UNIQUE INDEX participante_conversacion_conversacion_id_usuario_id_key ON participante_conversacion(conversacion_id, usuario_id);
CREATE UNIQUE INDEX mensaje_emisor_id_client_id_key ON mensaje(emisor_id, client_id);
CREATE INDEX participante_conversacion_usuario_id_conversacion_id_idx ON participante_conversacion(usuario_id, conversacion_id);
CREATE INDEX mensaje_id_conversacion_fecha_mensaje_id_idx ON mensaje(id_conversacion, fecha_mensaje, id);
COMMIT;
