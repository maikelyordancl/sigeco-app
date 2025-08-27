export interface FormularioCampo {
    id_campo: number;
    nombre_interno: string;
    etiqueta: string;
    tipo_campo: 'TEXTO_CORTO' | 'PARRAFO' | 'SELECCION_UNICA' | 'CASILLAS' | 'DESPLEGABLE' | 'ARCHIVO';
    es_visible: boolean;
    es_obligatorio: boolean;
    opciones?: { id_opcion: number; etiqueta_opcion: string }[];
}

export interface TicketData {
    id_tipo_entrada: number;
    nombre: string;
    precio: number;
}

export interface CampanaData {
    campana: {
        id_campana: number;
        id_subevento: number | null;
        nombre: string;
        evento_nombre: string;
        subevento_nombre: string | null;
        fecha_inicio: string;
        fecha_fin: string;
        ciudad: string;
        lugar: string;
        tipo_acceso: 'De Pago' | 'Gratuito';
        obligatorio_pago: boolean;
        obligatorio_registro: boolean;
        url_amigable: string;
        landing_page_json?: string | null;
    };
    tickets: TicketData[];
    formulario: FormularioCampo[];
}