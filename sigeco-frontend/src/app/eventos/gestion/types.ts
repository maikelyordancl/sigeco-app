export type EstadoEvento = "Activo" | "En Proceso" | "Finalizado" | "Cancelado";

export interface EventoContacto {
  nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export interface Evento {
  id_evento?: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  ciudad: string;
  lugar: string;
  presupuesto_marketing?: number;
  estado: EstadoEvento;
  link_drive?: string | null;
  contacto_1_nombre?: string | null;
  contacto_1_email?: string | null;
  contacto_1_telefono?: string | null;
  contacto_2_nombre?: string | null;
  contacto_2_email?: string | null;
  contacto_2_telefono?: string | null;
}

export const estadosEvento: EstadoEvento[] = ["Activo", "En Proceso", "Finalizado", "Cancelado"];
