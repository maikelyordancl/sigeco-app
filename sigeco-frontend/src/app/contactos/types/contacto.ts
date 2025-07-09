export type Contacto = {
  id_contacto: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rut: string;
  empresa?: string;
  actividad?: string;
  profesion?: string;
  pais: string;
  recibir_mail: boolean;
  fecha_creado: string;
  fecha_modificado: string;
};
