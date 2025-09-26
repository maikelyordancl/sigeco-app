// src/app/eventos/[id]/campanas/[id_campana]/asistentes/types.ts

// 1. CREAMOS UN TIPO EXPORTABLE PARA LOS ESTADOS
export type EstadoAsistencia = 
  | "Invitado" 
  | "Registrado" 
  | "Confirmado" 
  | "Asistió" 
  | "No Asiste" 
  | "Cancelado" 
  | "Por Confirmar" 
  | "Abrio Email";

export interface Asistente {
  id_inscripcion: number;
  id_contacto: number;
  nombre: string;
  email: string;
  telefono?: string;
  rut?: string;
  empresa?: string;
  // 2. USAMOS EL NUEVO TIPO AQUÍ
  estado_asistencia: EstadoAsistencia;
  nota?: string;
  [key: string]: any;
}

export interface CampoFormulario {
  id_campo: number;
  nombre_interno: string;
  etiqueta: string;
  tipo_campo:
    | "TEXTO_CORTO"
    | "PARRAFO"
    | "SELECCION_UNICA"
    | "DESPLEGABLE"
    | "CASILLAS"
    | "ARCHIVO";
  opciones?: string[] | { id_opcion: number; etiqueta_opcion: string; }[];
  es_de_sistema: boolean;
  orden: number;
  es_visible: boolean;
  es_obligatorio: boolean;
  es_fijo?: boolean; 
}