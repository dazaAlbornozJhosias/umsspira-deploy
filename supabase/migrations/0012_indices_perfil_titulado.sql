-- ============================================================
-- MIGRACION (PROPUESTA): Indices por titulado para el resumen del perfil
-- HU-03 · T3.2: Visualizar perfil (Epica 2, Perfil de Titulado)
-- Fecha: 2026-10-07
-- Autor: G7 (Perfil de Titulado)
-- ============================================================

-- Propuesta HU3 · T3.2 (Épica 2, Perfil de Titulado)
-- Índices para que el resumen del perfil (GET /api/v1/perfil) cargue en menos de 2 segundos.
-- PROPUESTA: no aplicar sin la aprobación de los leads de BD.
-- Nota: certificacion_respaldo no tiene id_titulado; se indexa por id_certificacion,
-- que es la columna por la que se buscan los respaldos de las certificaciones del titulado.

CREATE INDEX IF NOT EXISTS idx_formacion_academica_id_titulado
  ON formacion_academica (id_titulado);

CREATE INDEX IF NOT EXISTS idx_experiencia_laboral_id_titulado
  ON experiencia_laboral (id_titulado);

CREATE INDEX IF NOT EXISTS idx_certificacion_id_titulado
  ON certificacion (id_titulado);

CREATE INDEX IF NOT EXISTS idx_certificacion_respaldo_id_certificacion
  ON certificacion_respaldo (id_certificacion);
