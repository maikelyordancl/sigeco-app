export type EstadoEvento = "Activo" | "En Proceso" | "Finalizado" | "Cancelado";

export interface Evento {
  id_evento?: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  ciudad: string;
  lugar: string;
  presupuesto_marketing?: number;
  estado: EstadoEvento;
}

export const estadosEvento: EstadoEvento[] = ["Activo", "En Proceso", "Finalizado", "Cancelado"];
