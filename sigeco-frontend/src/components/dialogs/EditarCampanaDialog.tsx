"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

// Definimos la estructura de datos que esperamos de una campaña
interface Campana {
  id_campana: number;
  nombre: string;
  estado: "Borrador" | "Activa" | "Pausada" | "Finalizada";
  // Añadimos otros campos que puedan ser útiles, aunque no los editemos ahora
  tipo_acceso: string;
  url_amigable: string;
}

// Esquema de validación para el formulario
const campanaSchema = yup.object().shape({
  nombre: yup.string().required("El nombre es obligatorio."),
  estado: yup
    .string()
    .oneOf(["Borrador", "Activa", "Pausada", "Finalizada"])
    .required("El estado es requerido."),
});

type CampanaFormData = yup.InferType<typeof campanaSchema>;

interface EditarCampanaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campana: Campana | null; // El diálogo recibe la campaña a editar
  onCampanaActualizada: () => void; // Función para refrescar la lista
}

export const EditarCampanaDialog = ({
  isOpen,
  onClose,
  campana,
  onCampanaActualizada,
}: EditarCampanaDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CampanaFormData>({
    resolver: yupResolver(campanaSchema),
  });

  // useEffect para rellenar el formulario cuando se selecciona una campaña
  useEffect(() => {
    if (campana) {
      reset({
        nombre: campana.nombre,
        estado: campana.estado,
      });
    }
  }, [campana, reset]);

  const handleUpdateCampana = async (data: CampanaFormData) => {
    if (!campana) return;

    const toastId = toast.loading("Actualizando campaña...");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/campanas/${campana.id_campana}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudo actualizar la campaña.");
      }

      toast.success("Campaña actualizada con éxito", { id: toastId });
      onCampanaActualizada(); // Llama a la función para cerrar y refrescar
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Campaña</DialogTitle>
          <DialogDescription>
            Modifica el nombre y el estado de tu campaña.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleUpdateCampana)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Campaña</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              defaultValue={campana?.estado}
              onValueChange={(value) => setValue("estado", value as any, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Borrador">Borrador</SelectItem>
                <SelectItem value="Activa">Activa</SelectItem>
                <SelectItem value="Pausada">Pausada</SelectItem>
                <SelectItem value="Finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && <p className="text-red-500 text-sm mt-1">{errors.estado.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};