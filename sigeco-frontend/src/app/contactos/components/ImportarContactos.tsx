"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Contacto } from "../types/contacto";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";

type ImportarContactosProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshContactos: () => void;
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

        setContactosPreview(jsonData);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/basedatos/importar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
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
          const errorMessages = result.errors.map((err: any) => err.msg).join(' ');
          setError(`Error de validación: ${errorMessages}`);
        } else {
          setError(result.error || "Error al importar los contactos.");
        }
      }
    } catch (error) {
      setError("Error de red al intentar importar contactos.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN NUEVA PARA GENERAR Y DESCARGAR LA PLANTILLA ---
  const handleDownloadTemplate = () => {
    // 1. Definimos las cabeceras que necesita el backend
    const headers = [
      "nombre", "apellido", "email", "telefono", "rut", 
      "empresa", "actividad", "profesion", "pais"
    ];
    
    // 2. Creamos datos de ejemplo para guiar al usuario
    const exampleData = [{
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan.perez@ejemplo.com",
      telefono: "+56912345678",
      rut: "12.345.678-9",
      empresa: "Empresa Ejemplo S.A.",
      actividad: "Tecnología",
      profesion: "Ingeniero de Software",
      pais: "Chile"
    }];

    // 3. Creamos una hoja de cálculo a partir de los datos
    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    
    // 4. Creamos un libro de trabajo y añadimos la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contactos");

    // 5. Forzamos la descarga del archivo en el navegador del usuario
    XLSX.writeFile(workbook, "plantilla_importacion_contactos.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar Contactos desde Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <Button onClick={handleParseFile} className="w-full">
            Leer Archivo y Previsualizar
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

          {error && <div className="text-red-500 mt-2 p-2 bg-red-50 rounded">{error}</div>}

          {contactosPreview.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Mostrando primeros 10 contactos (de un total de {contactosPreview.length})</h3>
              <div className="overflow-x-auto rounded border max-h-[300px]">
                <Table className="min-w-[900px] text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Apellido</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead>País</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactosPreview.slice(0, 10).map((c, index) => (
                      <TableRow key={index}>
                        <TableCell>{c.nombre}</TableCell>
                        <TableCell>{c.apellido}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.telefono}</TableCell>
                        <TableCell>{c.rut}</TableCell>
                        <TableCell>{c.pais}</TableCell>
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
