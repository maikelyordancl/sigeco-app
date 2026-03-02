// src/app/acreditacion/[id_campana]/types.ts

export interface Inscripcion {
  id_inscripcion: number;
  id_contacto: number;
  nombre: string;
  email: string;

  /**
   * Nivel real del inscrito (ej: Invitado, Registrado, Confirmado).
   * Lo normalizamos en frontend para no depender de cómo venga el backend.
   */
  nivel?: string | null;

  /**
   * Estado de acreditación real para la UI:
   * Pendiente | Acreditado | Denegado
   */
  estado_acreditacion?: "Pendiente" | "Acreditado" | "Denegado" | string | null;

  /**
   * Fecha/hora en la que se acreditó (ISO string).
   */
  fecha_acreditacion?: string | null;

  /**
   * Fecha/hora de creación del contacto (ISO string).
   */
  fecha_creacion_contacto?: string | null;

  telefono?: string;
  rut?: string;
  empresa?: string;

  /**
   * Campo legacy del backend, hoy mezclado en algunos casos.
   * Puede traer nivel real (Confirmado, Registrado, etc.)
   * o estados usados para acreditación (Asistió, Cancelado).
   */
  estado_asistencia?:
    | "Invitado"
    | "Registrado"
    | "Confirmado"
    | "Asistió"
    | "No Asiste"
    | "Cancelado"
    | "Por Confirmar"
    | "Abrio Email"
    | string
    | null;

  /**
   * Estado del pago cuando el evento/campaña lo usa.
   */
  estado_pago?: string | null;
  estado_transaccion?: string | null;
  id_pago?: number | null;
  monto?: number | null;
  tipo_entrada?: string | null;

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

  opciones?: string[] | { id_opcion: number; etiqueta_opcion: string }[];

  es_de_sistema: boolean;
  orden: number;
  es_visible: boolean;
  es_obligatorio: boolean;
}

// --- Alias para compatibilidad con otros módulos ---
export type Asistente = Inscripcion;
export type TipoCampo = CampoFormulario["tipo_campo"];