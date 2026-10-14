-- ============================================================
-- MIGRACION: Agregar columnas de perfil corporativo a empresa
-- HU-04: Edicion de Datos del Perfil Corporativo
-- Fecha: 2025-10-03
-- Autor: Carlos Flores (G6 - Lead de BD)
-- ============================================================

-- Campos visuales del encabezado (HU-02)
-- eslogan: texto corto de presentacion de la empresa
-- logo_url: URL del logo corporativo en storage
-- banner_url: URL de la imagen de fondo del perfil
ALTER TABLE empresa
  ADD COLUMN IF NOT EXISTS eslogan VARCHAR(200),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Campos de detalle institucional (HU-03)
-- tamano_empresa: rango de tamano de la empresa
-- descripcion_larga: descripcion extendida hasta 2000 caracteres
ALTER TABLE empresa
  ADD COLUMN IF NOT EXISTS tamano_empresa VARCHAR(45),
  ADD COLUMN IF NOT EXISTS descripcion_larga TEXT;

-- Campos de auditoria (HU-04)
-- fecha_actualizacion: registra la ultima modificacion del perfil
ALTER TABLE empresa
  ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT NOW();

-- ============================================================
-- COMENTARIOS DE DOCUMENTACION (manual seccion 7.2.8)
-- ============================================================
COMMENT ON COLUMN empresa.eslogan IS 'Texto corto de presentacion de la empresa';
COMMENT ON COLUMN empresa.logo_url IS 'URL del logo corporativo almacenado';
COMMENT ON COLUMN empresa.banner_url IS 'URL de la imagen de fondo del perfil';
COMMENT ON COLUMN empresa.tamano_empresa IS 'Rango de tamano (ej: 50-200 empleados)';
COMMENT ON COLUMN empresa.descripcion_larga IS 'Descripcion institucional hasta 2000 caracteres';
COMMENT ON COLUMN empresa.fecha_actualizacion IS 'Fecha de ultima modificacion del perfil';

-- ============================================================
-- FIN DE LA MIGRACION
-- ============================================================