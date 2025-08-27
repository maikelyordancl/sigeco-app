export type Asistente = {
  id_inscripcion: number;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  actividad: string;
  profesion: string;
  estado_asistencia: string;
  nota: string | null;
  [key: string]: any;
};

// --- AÑADIR ESTE NUEVO TIPO ---
export type CampoFormulario = {
  id_campo: number;
  nombre_interno: string;
  etiqueta: string;
  tipo_campo: string;
  es_de_sistema: boolean;
  es_fijo: boolean;
  opciones?: { id_opcion: number; etiqueta_opcion: string }[];
};