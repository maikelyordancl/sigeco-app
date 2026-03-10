ALTER TABLE campanas
  ADD COLUMN registro_sin_pago_inmediato TINYINT(1) NOT NULL DEFAULT 0
  AFTER inscripcion_libre;
