ALTER TABLE eventos
  ADD COLUMN link_drive VARCHAR(500) NULL AFTER estado,
  ADD COLUMN contacto_1_nombre VARCHAR(150) NULL AFTER link_drive,
  ADD COLUMN contacto_1_email VARCHAR(150) NULL AFTER contacto_1_nombre,
  ADD COLUMN contacto_1_telefono VARCHAR(50) NULL AFTER contacto_1_email,
  ADD COLUMN contacto_2_nombre VARCHAR(150) NULL AFTER contacto_1_telefono,
  ADD COLUMN contacto_2_email VARCHAR(150) NULL AFTER contacto_2_nombre,
  ADD COLUMN contacto_2_telefono VARCHAR(50) NULL AFTER contacto_2_email;

ALTER TABLE subeventos
  ADD COLUMN contacto_1_nombre VARCHAR(150) NULL AFTER sitio_web,
  ADD COLUMN contacto_1_email VARCHAR(150) NULL AFTER contacto_1_nombre,
  ADD COLUMN contacto_1_telefono VARCHAR(50) NULL AFTER contacto_1_email,
  ADD COLUMN contacto_2_nombre VARCHAR(150) NULL AFTER contacto_1_telefono,
  ADD COLUMN contacto_2_email VARCHAR(150) NULL AFTER contacto_2_nombre,
  ADD COLUMN contacto_2_telefono VARCHAR(50) NULL AFTER contacto_2_email;
