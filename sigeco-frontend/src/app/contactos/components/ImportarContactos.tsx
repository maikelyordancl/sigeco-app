"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
// --- ¡ESTOS SON LOS WRAPPERS IMPORTANTES! ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Contacto } from "../types/contacto";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from 'lucide-react';

// ... (Todas tus interfaces y funciones de lógica van aquí:
// CampanaSimple, ContactoData, ImportarContactosProps, normalizeContactos, etc.)
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
// ... (resto de tu lógica)
const normalizeContactos = (contactos: ContactoData[]): ContactoData[] => {
  // ... tu código
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


const ImportarContactos: React.FC<ImportarContactosProps> = ({ open, setOpen, refreshContactos }) => {
  // ... (Todos tus hooks: useState, useEffect, etc. van aquí)
  const [file, setFile] = useState<File | null>(null);
  const [contactosPreview, setContactosPreview] = useState<ContactoData[]>([]);
  const [nombreBase, setNombreBase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [campanas, setCampanas] = useState<CampanaSimple[]>([]);
  const [selectedCampana, setSelectedCampana] = useState<string>('');
  const [isLoadingCampanas, setIsLoadingCampanas] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);

  // ... (Toda tu lógica: useEffect, handleFileChange, handleParseFile, handleUpload, handleDownloadTemplate)
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
    // ... tu código
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setContactosPreview([]);
    setHeaders([]);
    setError(null);
  };
  const handleParseFile = () => {
    // ... tu código
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
  const handleUpload = async () => {
    // ... tu código
    if (!contactosPreview.length) return setError("No hay contactos para importar.");
    setLoading(true);
    setError(null);
    try {
        if (selectedCampana) {
            const response = await apiFetch(`/campanas/${selectedCampana}/importar-inscripciones`, {
                method: "POST",
                body: JSON.stringify({
                    contactos: contactosPreview 
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ocurrió un error en el servidor.');
            }
            const result = await response.json();
            toast.success(result.message || "Importación a evento completada.");
        } else {
            if (!nombreBase.trim()) return setError("Debe ingresar un nombre para la base de datos.");
            const response = await apiFetch(`/basedatos/importar`, {
                method: "POST",
                body: JSON.stringify({
                    nombre_base: nombreBase.trim(),
                    contactos: contactosPreview
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ocurrió un error en el servidor.');
            }
            toast.success("Contactos importados con éxito a la nueva base de datos.");
        }
        refreshContactos(); 
        setOpen(false);
        setFile(null);
        setContactosPreview([]);
        setHeaders([]);
        setNombreBase("");
        setSelectedCampana("");
    } catch (error: any) {
        setError(error.message || "Error al procesar la importación.");
    } finally {
        setLoading(false);
    }
  };
  const handleDownloadTemplate = () => {
    // ... tu código
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

  // --- ¡AQUÍ ESTÁ LA ESTRUCTURA DEL LAYOUT CORREGIDA! ---
  return (
    // 1. El <Dialog> envuelve todo
    <Dialog open={open} onOpenChange={setOpen}>
      
      {/* 2. El <DialogContent> tiene el ancho y alto máximo, y el flex-col */}
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        
        {/* 3. El Header es fijo */}
        <DialogHeader>
          <DialogTitle>Importar Contactos desde Excel</DialogTitle>
        </DialogHeader>

        {/* 4. Este 'div' tiene el scroll (overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-6">
          
          {/* 5. TODO tu contenido original va aquí dentro */}
          
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
        
        {/* 6. El Footer es fijo y siempre visible */}
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