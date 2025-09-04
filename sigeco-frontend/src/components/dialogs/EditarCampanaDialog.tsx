"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";

// --- INICIO DE LA CORRECCIÓN ---
interface Campana {
  id_campana: number;
  nombre: string;
  estado: "Borrador" | "Activa" | "Pausada" | "Finalizada";
  url_amigable: string;
  inscripcion_libre: boolean;
  id_plantilla: number; // <--- AÑADIDO
}
// --- FIN DE LA CORRECCIÓN ---

// Esquema de validación para el formulario
const campanaSchema = yup.object().shape({
  nombre: yup.string().required("El nombre es obligatorio."),
  estado: yup
    .string()
    .oneOf(["Borrador", "Activa", "Pausada", "Finalizada"])
    .required("El estado es requerido."),
  inscripcion_libre: yup.boolean().required(),
  id_plantilla: yup.number().required("La plantilla es obligatoria."), // <--- AÑADIDO
});

type CampanaFormData = yup.InferType<typeof campanaSchema>;

interface EditarCampanaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campana: Campana | null;
  onCampanaActualizada: () => void;
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
    control,
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
        inscripcion_libre: !!campana.inscripcion_libre,
        id_plantilla: campana.id_plantilla || 1, // <--- AÑADIDO
      });
    }
  }, [campana, reset]);

  const handleUpdateCampana = async (data: CampanaFormData) => {
    if (!campana) return;

    const toastId = toast.loading("Actualizando campaña...");
    try {
      const response = await apiFetch(`/campanas/${campana.id_campana}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudo actualizar la campaña.");
      }

      toast.success("Campaña actualizada con éxito", { id: toastId });
      onCampanaActualizada();
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
            Modifica el nombre, el estado y la plantilla de tu campaña.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleUpdateCampana)}
          className="space-y-4 py-4"
        >
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="inscripcion_libre">
                Permitir Inscripción Pública
              </Label>
              <p className="text-xs text-muted-foreground">
                Si está activado, cualquiera puede inscribirse. Si no, solo los
                contactos previamente convocados.
              </p>
            </div>
            <Controller
              control={control}
              name="inscripcion_libre"
              render={({ field }) => (
                <Switch
                  id="inscripcion_libre"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <Label htmlFor="nombre">Nombre de la Campaña</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">
                {errors.nombre.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              defaultValue={campana?.estado}
              onValueChange={(value) =>
                setValue("estado", value as any, { shouldValidate: true })
              }
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
            {errors.estado && (
              <p className="text-red-500 text-sm mt-1">
                {errors.estado.message}
              </p>
            )}
          </div>
          {/* --- CAMPO AÑADIDO: Selección de plantilla --- */}
          <div>
            <Label htmlFor="id_plantilla">Plantilla</Label>
            <Select
              defaultValue={String(campana?.id_plantilla || 1)}
              onValueChange={(value) =>
                setValue("id_plantilla", parseInt(value, 10), {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  Clásica (Formulario a la derecha)
                </SelectItem>
                <SelectItem value="2">
                  Moderna (Formulario centrado)
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.id_plantilla && (
              <p className="text-red-500 text-sm mt-1">
                {errors.id_plantilla.message}
              </p>
            )}
          </div>
          {/* ------------------------------------------ */}
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
