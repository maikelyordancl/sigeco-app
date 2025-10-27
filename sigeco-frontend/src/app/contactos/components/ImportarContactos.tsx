"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Contacto } from "../types/contacto";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from 'lucide-react';

// --- Interfaces y Lógica de Normalización ---

interface CampanaSimple {
  id_campana: number;
  nombre: string;
}

type ContactoData = Partial<Contacto> & { [key: string]: any };

type ImportarContactosProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshContactos: () => void;
};

const normalizeContactos = (contactos: ContactoData[]): ContactoData[] => {
  return contactos.map(contacto => {
    const normalizedContacto: ContactoData = {};
    Object.keys(contacto).forEach(key => {
      let value = contacto[key];
      if (typeof value === 'string') {
        value = value.trim();
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('nombre')) {
            value = value.toUpperCase();
        } else if (lowerKey.includes('email')) {
            value = value.toLowerCase();
        } else if (lowerKey.includes('telefono')) {
            value = value.replace(/\s+/g, '');
        } else if (lowerKey.includes('rut')) {
            value = value.replace(/[.-]/g, '');
        }
      }
      normalizedContacto[key] = value;
    });
    return normalizedContacto;
  });
};


// --- Componente Principal ---

const ImportarContactos: React.FC<ImportarContactosProps> = ({ open, setOpen, refreshContactos }) => {
  const [file, setFile] = useState<File | null>(null);
  const [contactosPreview, setContactosPreview] = useState<ContactoData[]>([]);
  const [nombreBase, setNombreBase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [campanas, setCampanas] = useState<CampanaSimple[]>([]);
  const [selectedCampana, setSelectedCampana] = useState<string>('');
  const [isLoadingCampanas, setIsLoadingCampanas] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCampanas() {
      if (open && campanas.length === 0) {
        try {
          setIsLoadingCampanas(true);
          const response = await apiFetch('/campanas/listado-simple');
          if (!response.ok) throw new Error('Error al cargar eventos');
          const data = await response.json();
          if (Array.isArray(data)) {
            setCampanas(data);
          } else {
            toast.error('Error de formato en la respuesta de eventos.');
          }
        } catch (error) {
          console.error('Error al cargar la lista de eventos:', error);
          toast.error('No se pudo cargar la lista de eventos.');
        } finally {
          setIsLoadingCampanas(false);
        }
      }
    }
    fetchCampanas();
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setContactosPreview([]);
    setHeaders([]);
    setError(null);
  };

  const handleParseFile = () => {
    if (!file) return setError("Por favor, seleccione un archivo.");
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return setError("No se pudo leer el archivo.");
      try {
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonDataRaw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonDataRaw.length < 1) {
            setError("El archivo está vacío.");
            return;
        }
        const fileHeaders = jsonDataRaw[0].map(String);
        setHeaders(fileHeaders);
        const jsonData: ContactoData[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!jsonData.length) {
            setError("El archivo no contiene filas de datos.");
            return;
        }
        setContactosPreview(normalizeContactos(jsonData));
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error al procesar el archivo. Asegúrese de que el formato sea correcto.");
      }
    };
    reader.readAsBinaryString(file);
  };

  /**
   * Formatea los errores recibidos de la API (ya sea un string o un array) 
   * en un solo string legible con saltos de línea.
   */
  const formatApiError = (errorData: any): string => {
    // Caso 1: El error es un array 'errors' (como en tu JSON)
    if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      const mensajesError = errorData.errors.map((err: any, index: number) => 
        // err.value parece contener los emails duplicados
        `Error ${index + 1}: ${err.value || 'Error desconocido'}`
      ).join('\n'); // Unir con saltos de línea
      
      return `Ocurrieron errores en la importación:\n${mensajesError}`;
    }
    
    // Caso 2: El error es un string 'error' (el formato anterior)
    if (errorData.error && typeof errorData.error === 'string') {
      return errorData.error;
    }

    // Caso 3: Fallback genérico
    return 'Ocurrió un error desconocido en el servidor.';
  };

  // --- FUNCIÓN ACTUALIZADA ---
  const handleUpload = async () => {
    if (!contactosPreview.length) return setError("No hay contactos para importar.");
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (selectedCampana) {
        // --- Importar a Evento (Campaña) ---
        response = await apiFetch(`/campanas/${selectedCampana}/importar-inscripciones`, {
            method: "POST",
            body: JSON.stringify({
                contactos: contactosPreview 
            }),
        });

      } else {
        // --- Importar a nueva Base de Datos ---
        if (!nombreBase.trim()) {
            setError("Debe ingresar un nombre para la base de datos.");
            setLoading(false);
            return; // Salir temprano si falta el nombre
        }
        
        response = await apiFetch(`/basedatos/importar`, {
            method: "POST",
            body: JSON.stringify({
                nombre_base: nombreBase.trim(),
                contactos: contactosPreview
            }),
        });
      }

      // --- Manejo de Respuesta Unificado ---
      if (!response.ok) {
        // Si la respuesta no es OK (ej: 400, 500)
        const errorData = await response.json();
        // Usamos la función helper para formatear el error
        throw new Error(formatApiError(errorData)); 
      }

      // Si la respuesta es OK (ej: 200, 201)
      if (selectedCampana) {
        const result = await response.json();
        toast.success(result.message || "Importación a evento completada.");
      } else {
        toast.success("Contactos importados con éxito a la nueva base de datos.");
      }

      // Limpieza y cierre del modal
      refreshContactos(); 
      setOpen(false);
      setFile(null);
      setContactosPreview([]);
      setHeaders([]);
      setNombreBase("");
      setSelectedCampana("");

    } catch (error: any) {
      // El 'catch' ahora recibe el error formateado desde el 'throw'
      setError(error.message || "Error al procesar la importación.");
    
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    if (selectedCampana) {
      apiFetch(`/campanas/${selectedCampana}/plantilla-importacion`)
        .then(response => {
            if (!response.ok) throw new Error('No se pudo descargar la plantilla');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "plantilla_importacion_evento.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Descargando plantilla del evento...');
        })
        .catch(err => toast.error(err.message));
      return;
    }

    const headers = ["nombre", "email", "telefono", "rut", "empresa", "actividad", "profesion", "pais", "comuna"];
    const exampleData = [{ nombre: "Juan Pérez", email: "juan.perez@ejemplo.com", telefono: "+56912345678", rut: "12.345.678-9", empresa: "Empresa Ejemplo S.A.", actividad: "Tecnología", profesion: "Ingeniero de Software", pais: "Chile", comuna: "Coronel" }];
    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contactos");
    XLSX.writeFile(workbook, "plantilla_importacion_contactos.xlsx");
  };

  // --- Renderizado del Componente (Layout) ---
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        
        <DialogHeader>
          <DialogTitle>Importar Contactos desde Excel</DialogTitle>
        </DialogHeader>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Asociar a un Evento (Opcional)</label>
            <div className="flex items-center gap-2">
              <Select onValueChange={setSelectedCampana} disabled={isLoadingCampanas}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCampanas ? "Cargando eventos..." : "Seleccione un evento"} />
                </SelectTrigger>
                <SelectContent>
                  {campanas.map((campana) => (
                    <SelectItem key={campana.id_campana} value={String(campana.id_campana)}>
                      {campana.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <Button onClick={handleParseFile} className="w-full">Leer, Limpiar y Previsualizar</Button>
          
          <button onClick={handleDownloadTemplate} className="text-blue-600 text-sm underline mt-2 block text-center w-full">
            {selectedCampana ? 'Descargar plantilla para el evento seleccionado' : 'Descargar planilla de ejemplo genérica'}
          </button>
          
          {!selectedCampana && (
            <div className="mt-4">
              <label className="text-sm font-medium block mb-1">Nombre de la nueva base de datos:</label>
              <Input value={nombreBase} onChange={(e) => setNombreBase(e.target.value)} placeholder="Ej: Contactos Feria Gastronómica 2025"/>
            </div>
          )}
          
          {/* El contenedor de error ya estaba preparado para múltiples líneas */}
          {error && (
            <div className="text-red-500 mt-2 p-2 bg-red-50 rounded whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: error.replace(/\n/g, '<br />') }}>
            </div>
          )}

          {contactosPreview.length > 0 && headers.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Mostrando primeros 10 contactos (de un total de {contactosPreview.length})</h3>
              <div className="overflow-x-auto rounded border max-h-[300px]">
                <Table className="min-w-[900px] text-sm">
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={`${header}-${index}`}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactosPreview.slice(0, 10).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {headers.map((header, colIndex) => (
                          <TableCell key={`${header}-${colIndex}`}>{String(row[header] ?? '')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Fijo */}
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={loading || contactosPreview.length === 0 || (!nombreBase.trim() && !selectedCampana)}>
            {loading ? "Importando..." : "Confirmar e Importar"}
          </Button>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  );
};

export default ImportarContactos;
