export type Contacto = {
  id_contacto: number;
  nombre: string;
  email: string;
  telefono: string;
  rut: string;
  empresa?: string;
  actividad?: string;
  profesion?: string;
  pais: string;
  comuna?: string;
  recibir_mail: boolean;
  fecha_creado: string;
  fecha_modificado: string;
};

export type BaseDatos = {
  id_base: number;
  nombre: string;
  origen: string;
  fecha_creado: string;
  cantidad_contactos: number;
};