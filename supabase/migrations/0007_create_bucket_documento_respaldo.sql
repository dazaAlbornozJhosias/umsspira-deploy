-- ============================================================
-- 0007_create_bucket_documento_respaldo.sql
-- Crea el bucket de Storage para documentos de respaldo
-- Nombre alineado con el backend NestJS: 'documentos-respaldo'
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-respaldo', 'documentos-respaldo', false)
ON CONFLICT (id) DO NOTHING;