export interface CampanaPublica {
    id_campana: number;
    nombre: string;
    evento_nombre: string;
    landing_page_json: string | null;
    id_plantilla?: number; // Aseguramos que este campo siempre esté presente
    inscripcion_libre: boolean;
    registro_sin_pago_inmediato?: boolean;
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

// Props del presenter de landing
export interface LandingPageProps {
    data: {
        campana: CampanaPublica;
        tickets: Ticket[];
        formulario: FormularioConfig;
    } | null;
    children?: React.ReactNode;   // <-- añadido para soportar <Frame> en editor
    form?: React.ReactNode;       // <-- añadido para soportar formulario placeholder
}

// Para reutilizar en otras partes del código
export interface CampanaData {
    campana: CampanaPublica;
    tickets: Ticket[];
    formulario: FormularioConfig;
}

export interface CampanaAdmin {
  id_campana: number;
  nombre: string;
  estado: "Borrador" | "Activa" | "Pausada" | "Finalizada";
  url_amigable: string;
  id_subevento: number | null;
  inscripcion_libre: boolean;
  registro_sin_pago_inmediato?: boolean;
  id_plantilla: number; // 👈 aseguramos que esté
  total_ingresos?: number;
  subevento_nombre?: string;
  obligatorio_registro: boolean | null;
  obligatorio_pago: boolean | null;
  invitados?: number;
  registrados?: number;
  confirmados?: number;
  asistieron?: number;
  cancelados?: number;
  pagados?: number;
  fecha_personalizada?: string;
}
