// src/app/acreditacion/[id_campana]/types.ts

export interface Inscripcion {
  id_inscripcion: number;
  id_contacto: number;
  nombre: string;
  email: string;
  telefono?: string;
  rut?: string;
  empresa?: string;
  estado_asistencia:
    | "Invitado"
    | "Registrado"
    | "Confirmado"
    | "Asistió"
    | "No Asiste"
    | "Cancelado"
    | "Por Confirmar"
    | "Abrio Email";
  nota?: string;
  [key: string]: any; // Para campos dinámicos
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

  // Aceptamos el formato de array que viene de la base de datos.
  opciones?: string[] | { id_opcion: number; etiqueta_opcion: string }[];

  es_de_sistema: boolean;
  orden: number;
  es_visible: boolean;
  es_obligatorio: boolean;
}

// --- Alias para compatibilidad con otros módulos ---
export type Asistente = Inscripcion;
export type TipoCampo = CampoFormulario["tipo_campo"];
