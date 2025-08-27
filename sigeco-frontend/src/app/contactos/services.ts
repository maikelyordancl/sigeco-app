import { Contacto, BaseDatos } from "./types/contacto"; 
import { mapContacto } from "./utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchContactos = async (): Promise<Contacto[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/contactos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error al obtener contactos");
  return data.contactos.map(mapContacto);
};

export const fetchBasesDatos = async (): Promise<BaseDatos[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/bases-datos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error al obtener bases de datos");
  return data.basesDatos;
};

export const crearBaseDatos = async (nombre: string): Promise<BaseDatos> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/bases-datos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nombre }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error al crear base de datos");
  return data.baseDatos;
};
