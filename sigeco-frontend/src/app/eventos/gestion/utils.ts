import { EstadoEvento } from "./types";

export const mapEstado = (estado: number): EstadoEvento => {
  switch (estado) {
    case 1:
      return "Activo";
    case 2:
      return "En Proceso";
    case 3:
      return "Finalizado";
    case 4:
      return "Cancelado";
    default:
      return "Activo";
  }
};

export const reverseMapEstado = (estado: EstadoEvento): number => {
  switch (estado) {
    case "Activo":
      return 1;
    case "En Proceso":
      return 2;
    case "Finalizado":
      return 3;
    case "Cancelado":
      return 4;
    default:
      return 1;
  }
};

export const formatPresupuesto = (value: string): string => {
  const numericValue = value.replace(/\D/g, ""); // Solo números
  return new Intl.NumberFormat("es-CL").format(Number(numericValue)); // Formatea con separadores de miles
};

export const getBadgeColor = (estado: EstadoEvento) => {
  switch (estado) {
    case "Activo":
      return "bg-green-500 text-white";
    case "En Proceso":
      return "bg-yellow-500 text-black";
    case "Finalizado":
      return "bg-gray-500 text-white";
    case "Cancelado":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-300 text-black";
  }
};
