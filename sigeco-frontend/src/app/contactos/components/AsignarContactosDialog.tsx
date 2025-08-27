"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api";
import { BaseDatos } from "../types/contacto";

interface AsignarContactosDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  contactIds: number[];
  basesDeDatos: BaseDatos[];
  onAsignacionCompleta: () => void;
}

export const AsignarContactosDialog: React.FC<AsignarContactosDialogProps> = ({
  open,
  setOpen,
  contactIds,
  basesDeDatos,
  onAsignacionCompleta,
}) => {
  const [selectedBases, setSelectedBases] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Limpiar selección cuando se abre el diálogo
    if (open) {
      setSelectedBases([]);
    }
  }, [open]);

  const handleToggleBase = (id_base: number) => {
    setSelectedBases((prev) =>
      prev.includes(id_base)
        // --- **LÍNEA CORREGIDA** ---
        ? prev.filter((currentId) => currentId !== id_base)
        : [...prev, id_base]
    );
  };

  const handleAsignar = async () => {
    if (contactIds.length === 0 || selectedBases.length === 0) {
      toast.error("Debe seleccionar al menos un contacto y una base de datos.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Asignando contactos...");

    try {
      const response = await apiFetch('/basedatos/asignar', {
        method: 'POST',
        body: JSON.stringify({
          contactIds: contactIds,
          baseIds: selectedBases,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo completar la asignación.");
      }

      toast.success(result.message || "Contactos asignados con éxito.", { id: toastId });
      onAsignacionCompleta(); // Cierra el modal y refresca los datos
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar {contactIds.length} Contacto(s) a...</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Label>Selecciona una o más bases de datos de destino:</Label>
          <div className="max-h-64 overflow-y-auto border rounded-md p-3 space-y-2">
            {basesDeDatos.map((base) => (
              <div key={base.id_base} className="flex items-center space-x-2">
                <Checkbox
                  id={`base-checkbox-${base.id_base}`}
                  checked={selectedBases.includes(base.id_base)}
                  onCheckedChange={() => handleToggleBase(base.id_base)}
                />
                <Label htmlFor={`base-checkbox-${base.id_base}`} className="cursor-pointer">
                  {base.nombre} ({base.cantidad_contactos} contactos)
                </Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAsignar} disabled={loading || selectedBases.length === 0}>
            {loading ? "Asignando..." : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};