"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Contacto } from "../types/contacto";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

type ImportarContactosProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshContactos: () => void;
};

type ValidationError = {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
};

const normalizeContactos = (contactos: Partial<Contacto>[]): Partial<Contacto>[] => {
  return contactos.map(contacto => {
    const normalizedContacto: Partial<Contacto> = {};

    Object.keys(contacto).forEach(key => {
      const typedKey = key as keyof Contacto;
      let value = contacto[typedKey];

      if (typeof value === 'string') {
        value = value.trim();
        switch (typedKey) {
          case 'nombre':
            value = value.toUpperCase();
            break;
          case 'email':
            value = value.toLowerCase();
            break;
          case 'telefono':
            value = value.replace(/\s+/g, '');
            break;
          case 'rut':
            value = value.replace(/[.-]/g, '');
            break;
        }
      }
      // --- CORRECCIÓN APLICADA AQUÍ ---
      (normalizedContacto as any)[typedKey] = value;
    });

    return normalizedContacto;
  });
};


const ImportarContactos: React.FC<ImportarContactosProps> = ({ open, setOpen, refreshContactos }) => {
  const [file, setFile] = useState<File | null>(null);
  const [contactosPreview, setContactosPreview] = useState<Partial<Contacto>[]>([]);
  const [nombreBase, setNombreBase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setContactosPreview([]);
    setError(null);
  };

  const handleParseFile = () => {
    if (!file) {
      setError("Por favor, seleccione un archivo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) {
        setError("No se pudo leer el archivo.");
        return;
      }

      try {
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData: Partial<Contacto>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!jsonData.length) {
          setError("El archivo no contiene datos.");
          return;
        }
        
        const normalizedData = normalizeContactos(jsonData);
        setContactosPreview(normalizedData);
        
        setError(null);
      } catch {
        setError("Error al procesar el archivo. Asegúrese de que el formato sea correcto.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (!contactosPreview.length) {
      setError("No hay contactos para importar.");
      return;
    }

    if (!nombreBase.trim()) {
      setError("Debe ingresar un nombre para la base de datos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/basedatos/importar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_base: nombreBase.trim(),
          contactos: contactosPreview
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Contactos importados con éxito.");
        refreshContactos();
        setOpen(false);
        setFile(null);
        setContactosPreview([]);
        setNombreBase("");
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors.map((err: ValidationError) => {
            const match = err.path.match(/\[(\d+)\]/);
            const index = match ? parseInt(match[1], 10) : -1;
            const rowNumber = index !== -1 ? index + 2 : "desconocida";
            
            return `Fila ${rowNumber}: ${err.msg} (Valor: "${err.value}")`;
          }).join('\n');
          
          setError(`Se encontraron los siguientes errores:\n${errorMessages}`);
        } else {
          setError(result.error || "Error al importar los contactos.");
        }
      }
    } catch (error: any) {
        if (error.response) {
            const result = await error.response.json();
            if (result.errors && Array.isArray(result.errors)) {
                const errorMessages = result.errors.map((err: ValidationError) => {
                    const match = err.path.match(/\[(\d+)\]/);
                    const index = match ? parseInt(match[1], 10) : -1;
                    const rowNumber = index !== -1 ? index + 2 : "desconocida";
                    return `Fila ${rowNumber}: ${err.msg} (Valor: "${err.value}")`;
                }).join('<br/>');
                
                setError(`Se encontraron los siguientes errores:<br/>${errorMessages}`);
            } else {
                setError(result.error || "Error al importar los contactos.");
            }
        } else {
            setError("Error de red al intentar importar contactos.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "nombre", "email", "telefono", "rut", 
      "empresa", "actividad", "profesion", "pais", "comuna"
    ];
    
    const exampleData = [{
      nombre: "Juan Pérez",
      email: "juan.perez@ejemplo.com",
      telefono: "+56912345678",
      rut: "12.345.678-9",
      empresa: "Empresa Ejemplo S.A.",
      actividad: "Tecnología",
      profesion: "Ingeniero de Software",
      pais: "Chile",
      comuna: "Coronel"
    }];

    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contactos");

    XLSX.writeFile(workbook, "plantilla_importacion_contactos.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Importar Contactos desde Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <Button onClick={handleParseFile} className="w-full">
            Leer, Limpiar y Previsualizar
          </Button>

          <button
            onClick={handleDownloadTemplate}
            className="text-blue-600 text-sm underline mt-2 block text-center w-full"
          >
            Descargar planilla de ejemplo (.xlsx)
          </button>

          <div className="mt-4">
            <label className="text-sm font-medium block mb-1">Nombre de la nueva base de datos:</label>
            <Input
              value={nombreBase}
              onChange={(e) => setNombreBase(e.target.value)}
              placeholder="Ej: Contactos Feria Gastronómica 2025"
            />
          </div>

          {error && (
            <div 
              className="text-red-500 mt-2 p-2 bg-red-50 rounded whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: error.replace(/\n/g, '<br />') }}
            >
            </div>
          )}

          {contactosPreview.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Mostrando primeros 10 contactos (de un total de {contactosPreview.length})</h3>
              <div className="overflow-x-auto rounded border max-h-[300px]">
                <Table className="min-w-[900px] text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Comuna</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactosPreview.slice(0, 10).map((c, index) => (
                      <TableRow key={index}>
                        <TableCell>{c.nombre}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.telefono}</TableCell>
                        <TableCell>{c.rut}</TableCell>
                        <TableCell>{c.pais}</TableCell>
                        <TableCell>{c.comuna}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleUpload}
            disabled={loading || contactosPreview.length === 0 || !nombreBase.trim()}
          >
            {loading ? "Importando..." : "Confirmar e Importar Contactos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarContactos;