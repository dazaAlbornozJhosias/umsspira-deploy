ALTER TABLE vacante
  ADD COLUMN IF NOT EXISTS nivel_experiencia VARCHAR(50),
  ADD COLUMN IF NOT EXISTS descripcion_tecnica TEXT;
