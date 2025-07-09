"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "react-hot-toast";

type BaseDatos = {
  id_base: number;
  nombre: string;
};

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  bases: BaseDatos[];
  refresh: () => void;
  token: string | null;
};

export default function FusionarBases({ open, setOpen, bases, refresh, token }: Props) {
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [nombre, setNombre] = useState<string>("");
  const [origen, setOrigen] = useState<string>("");

  const toggleBase = (id: number) => {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const fusionar = async () => {
    if (seleccionadas.length < 2) { // Lógicamente, se necesitan al menos 2 para fusionar
      toast.error("Debes seleccionar al menos dos bases de datos para fusionar.");
      return;
    }

    if (!nombre.trim()) {
      toast.error("Debes ingresar un nombre para la nueva base de datos.");
      return;
    }

    try {
      // URL actualizada para apuntar al nuevo endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/basedatos/fusionar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          bases_origen: seleccionadas,
          nombre: nombre.trim(),
          origen: origen.trim() || 'Fusión'
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Bases fusionadas y nueva base creada.");
        setSeleccionadas([]);
        setNombre("");
        setOrigen("");
        setOpen(false);
        refresh();
      } else {
        toast.error(result.error || "Error al fusionar bases.");
      }
    } catch {
      toast.error("Error de red al intentar fusionar bases.");
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fusionar Bases de Datos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-semibold">Selecciona bases origen:</p>
            <div className="max-h-48 overflow-y-auto border rounded p-2">
              {bases.map(base => (
                <label key={base.id_base} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    checked={seleccionadas.includes(base.id_base)}
                    onCheckedChange={() => toggleBase(base.id_base)}
                  />
                  <span>{base.nombre} ({base.cantidad_contactos})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold">Nombre de nueva base:</p>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Base Fusionada Abril" />
          </div>

          <div>
            <p className="font-semibold">Origen (opcional):</p>
            <Input value={origen} onChange={(e) => setOrigen(e.target.value)} placeholder="Ej: Fusión manual" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={fusionar}>Fusionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
