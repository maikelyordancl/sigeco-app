"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { Contacto } from "../types/contacto";

type SeleccionarContactosProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  eventoId: number | null;
  refreshBasesDeDatos: () => void;
};

const SeleccionarContactos: React.FC<SeleccionarContactosProps> = ({ open, setOpen, eventoId, refreshBasesDeDatos }) => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [selectedContactos, setSelectedContactos] = useState<number[]>([]);
  const [nombreBaseDatos, setNombreBaseDatos] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventoId) {
      fetch(`/api/eventos/${eventoId}/contactos`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setContactos(result.data);
            setError(null);
          } else {
            setError(result.error || "Error al obtener los contactos.");
          }
        })
        .catch(() => setError("Error de red al obtener los contactos."));
    }
  }, [eventoId]);

  const handleSelectContacto = (id: number) => {
    setSelectedContactos((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleGuardarBaseDatos = async () => {
    if (!nombreBaseDatos.trim()) {
      setError("El nombre de la base de datos es obligatorio.");
      return;
    }
    if (selectedContactos.length === 0) {
      setError("Debe seleccionar al menos un contacto.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bases-de-datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreBaseDatos,
          contactos: selectedContactos,
          origen: `Evento ${eventoId}`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Base de datos creada con éxito.");
        refreshBasesDeDatos();
        setOpen(false);
      } else {
        setError(result.error || "Error al guardar la base de datos.");
      }
    } catch {
      setError("Error de red al guardar la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seleccionar Contactos para Nueva Base de Datos</DialogTitle>
        </DialogHeader>

        {error && <div className="text-red-500 text-center">{error}</div>}

        <input
          type="text"
          value={nombreBaseDatos}
          onChange={(e) => setNombreBaseDatos(e.target.value)}
          placeholder="Nombre de la base de datos"
          className="w-full p-2 border rounded mb-4"
        />

        <div className="max-h-64 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seleccionar</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactos.map((contacto) => (
                <TableRow key={contacto.id_contacto}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContactos.includes(contacto.id_contacto)}
                      onCheckedChange={() => handleSelectContacto(contacto.id_contacto)}
                    />
                  </TableCell>
                  <TableCell>{contacto.nombre}</TableCell>
                  <TableCell>{contacto.email}</TableCell>
                  <TableCell>{contacto.telefono}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleGuardarBaseDatos} disabled={loading || selectedContactos.length === 0}>
            {loading ? "Guardando..." : "Crear Base de Datos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SeleccionarContactos;
