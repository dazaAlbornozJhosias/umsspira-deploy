-- ============================================================
-- 0006: Bucket de Storage para los respaldos de certificaciones (HU1 · T1.9)
-- Privado: solo el backend (clave service_role) sube y lee archivos.
-- Mismas reglas que ArchivoRespaldoPipe: solo JPG y hasta 5 MB.
-- Se puede correr más de una vez sin error.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('respaldos-certificacion', 'respaldos-certificacion', false, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
