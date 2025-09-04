export interface CampanaPublica {
    id_campana: number;
    nombre: string;
    evento_nombre: string;
    landing_page_json: string | null;
    id_plantilla: number; // Aseguramos que este campo siempre esté presente
    inscripcion_libre: boolean;
    obligatorio_pago?: boolean;
}

export interface Ticket {
    id_tipo_entrada: number;
    nombre: string;
    precio: number;
    cantidad_total: number;
    cantidad_vendida: number;
}

export interface FormularioCampo {
    id_campo: number;
    etiqueta: string;
    tipo_campo: string;
    nombre_interno: string;
    es_de_sistema: boolean;
    es_visible: boolean;
    es_obligatorio: boolean;
    orden: number;
    opciones: any[];
}

export interface FormularioConfig {
    campos: FormularioCampo[];
}

// Renombramos la interfaz principal para que coincida con lo que usan los componentes
export interface LandingPageProps {
    data: {
        campana: CampanaPublica;
        tickets: Ticket[];
        formulario: FormularioConfig;
    } | null;
}
