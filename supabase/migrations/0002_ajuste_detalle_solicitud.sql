-- 0002_ajuste_detalle_solicitud.sql
-- Agrega "expedido_en" a detalle_solicitud (CA-01.4)

ALTER TABLE detalle_solicitud
    ADD COLUMN IF NOT EXISTS expedido_en VARCHAR(20)
    CHECK (expedido_en IN ('LP','CB','SC','OR','PT','TJ','CH','BE','PD','Extranjero'));