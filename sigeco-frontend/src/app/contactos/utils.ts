import { Contacto } from "./types/contacto";


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
  // 👇 CORRECCIÓN: Se cambia 'id' por 'id_contacto' para que coincida con el tipo
  id_contacto: data.id_contacto, 
  nombre: capitalizarTexto(data.nombre),
  email: data.email,
  telefono: data.telefono,
  rut: data.rut,
  empresa: data.empresa,
  actividad: data.actividad,
  profesion: data.profesion,
  pais: data.pais,
  comuna: data.comuna,
  recibir_mail: data.recibir_mail,
  fecha_creado: data.fecha_creado,
  fecha_modificado: data.fecha_modificado
});
