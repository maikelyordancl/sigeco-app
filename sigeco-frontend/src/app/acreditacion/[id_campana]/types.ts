// src/app/acreditacion/[id_campana]/types.ts

export interface Asistente {
  id_inscripcion: number;
  estado_asistencia: string;
  nombre: string;
  email: string;
  [key: string]: any; // Permite campos personalizados dinámicos
}

export interface CampoFormulario {
  id_campo: number;
  nombre_interno: string;
  etiqueta: string;
  es_visible: number;
  es_de_sistema: number;
}