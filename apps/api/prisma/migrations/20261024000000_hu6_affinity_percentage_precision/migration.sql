-- HU-6: conserva porcentajes de afinidad con dos decimales.
ALTER TABLE "afinidad_radar"
ALTER COLUMN "porcentaje" TYPE DECIMAL(5, 2)
USING ROUND("porcentaje", 2);
