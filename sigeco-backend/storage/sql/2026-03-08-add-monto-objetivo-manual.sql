ALTER TABLE inscripciones
  ADD COLUMN monto_objetivo_manual DECIMAL(12,2) NULL DEFAULT NULL AFTER monto_pagado_manual;
