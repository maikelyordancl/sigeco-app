export interface Asistente {
    id_inscripcion: number;
    // Hacemos el estado flexible para aceptar los valores de la base de datos
    estado_asistencia: string; 
    nombre: string;
    email: string;
    // Permite que lleguen campos personalizados sin errores
    [key: string]: any; 
}

// Definimos los tipos válidos de campo
export type TipoCampo =
    | "TEXTO_CORTO"
    | "PARRAFO"
    | "DESPLEGABLE"
    | "SELECCION_UNICA"
    | "CASILLAS"
    | "ARCHIVO";

export interface CampoFormulario {
    id_campo: number;
    nombre_interno: string;
    etiqueta: string;
    es_visible: boolean;
    es_de_sistema: boolean;
    tipo_campo: TipoCampo; // ← union estricta
    es_obligatorio: boolean;
    opciones?: string; // Mantener string si viene de backend
}
