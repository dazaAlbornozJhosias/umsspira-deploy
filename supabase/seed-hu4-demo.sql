-- ============================================================
-- CONSOLIDADO EN supabase/seed.sql
--
-- Los 15 expedientes de demostración de la Bandeja de Solicitudes (HU-04) que
-- generaba este archivo ahora viven en supabase/seed.sql, sección 13, con UUID
-- fijo y carrera resuelta por id (este archivo la buscaba con ILIKE ... LIMIT 1
-- y generaba UUID nuevos en cada corrida, así que duplicaba filas).
--
-- Ejecute supabase/seed.sql: es el script único del proyecto (esquema que
-- esperan el backend y el frontend + todos los datos de demostración).
-- Verificación: SELECT estado, COUNT(*) FROM solicitud GROUP BY estado;
-- ============================================================

SELECT 'Este archivo fue consolidado en supabase/seed.sql; ejecute ese.' AS aviso;
