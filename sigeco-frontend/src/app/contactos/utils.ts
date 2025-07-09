// Formatea números de teléfono a un formato estándar
export const formatearTelefono = (telefono: string): string => {
  return telefono.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
};

// Capitaliza la primera letra de cada palabra
export const capitalizarTexto = (texto: string): string => {
  return texto.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Mapea un contacto desde la API a nuestro formato interno
export const mapContacto = (data: any): Contacto => ({
  id: data.id,
  nombre: capitalizarTexto(data.nombre),
  email: data.email,
  telefono: formatearTelefono(data.telefono),
  ciudad: capitalizarTexto(data.ciudad),
  origen: data.origen as "manual" | "importado" | "evento",
  id_base_datos: data.id_base_datos || undefined,
});
