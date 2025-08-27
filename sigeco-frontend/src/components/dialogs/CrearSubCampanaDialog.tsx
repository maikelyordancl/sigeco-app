"use client";

import { useState, useEffect } from "react";
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
import { apiFetch } from "@/lib/api";

// --- CORRECCIÓN: Se elimina 'tipo_acceso' del esquema de validación ---
const schema = yup.object().shape({
  nombre: yup.string().required("El nombre de la campaña es requerido."),
  url_amigable: yup.string().required("La URL amigable es requerida.").matches(/^[a-zA-Z0-9-]+$/, "La URL solo puede contener letras, números y guiones."),
  id_subevento: yup
    .number()
    .transform(value => (isNaN(value) ? undefined : value))
    .required("Debes seleccionar un sub-evento.")
    .positive("Debes seleccionar un sub-evento."),
});
// --- FIN DE LA CORRECCIÓN ---

type FormData = yup.InferType<typeof schema>;

// Tipo para los sub-eventos que recibimos de la API
interface Subevento {
  id_subevento: number;
  nombre: string;
}

interface CrearSubCampanaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  id_evento: number;
  onSubCampanaCreada: () => void;
}

// Función para generar slugs
const generarSlug = (texto: string) => {
    return texto
        .trim()
        .replace(/\s+/g, '-') // Reemplazar espacios con -
        .replace(/[^\w-]+/g, '') // Remover caracteres inválidos
        .replace(/--+/g, '-'); // Reemplazar múltiples - con uno solo
};

export const CrearSubCampanaDialog = ({
  isOpen,
  onClose,
  id_evento,
  onSubCampanaCreada,
}: CrearSubCampanaDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subeventos, setSubeventos] = useState<Subevento[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const nombreCampana = watch("nombre");
  useEffect(() => {
      if(nombreCampana) {
          setValue("url_amigable", generarSlug(nombreCampana), { shouldValidate: true });
      }
  }, [nombreCampana, setValue]);

  // Efecto que se dispara para buscar los sub-eventos disponibles
  useEffect(() => {
    if (isOpen && id_evento) {
      const fetchSubeventosDisponibles = async () => {
        try {
          const response = await apiFetch(  
            `/subeventos/evento/${id_evento}/campanas`,
            { method: "GET" }
          );

          if (!response.ok) throw new Error("No se pudieron cargar los sub-eventos.");
          
          const result = await response.json();
          if (result.success) {
            setSubeventos(result.data);
          }
        } catch (error: any) {
          toast.error(error.message || "Error al cargar sub-eventos.");
        }
      };
      fetchSubeventosDisponibles();
    }
  }, [isOpen, id_evento]);

  // Función para manejar el envío del formulario
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Creando sub-campaña...");

    try {
      // La ruta para crear campañas es '/api/campanas' con el método POST
      const response = await apiFetch(`/campanas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // El payload incluye id_subevento, que ahora sí lo tenemos.
          body: JSON.stringify({
            ...data,
            id_evento, 
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Manejamos los errores de validación que envía el backend
        if (result.errors && Array.isArray(result.errors)) {
            const errorMessage = result.errors.map((e: any) => e.msg).join('. ');
            throw new Error(errorMessage);
        }
        throw new Error(result.error || "Error al crear la sub-campaña");
      }

      toast.success("Sub-campaña creada con éxito", { id: toastId });
      onSubCampanaCreada(); // Cierra el modal y refresca la lista
      
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
    // Resetea el formulario y el estado al cerrar
    const handleClose = () => {
        reset();
        setSubeventos([]);
        onClose();
    }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Sub-Campaña</DialogTitle>
          <DialogDescription>
            Asocia una nueva campaña a un sub-evento existente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Campo Select para elegir el Sub-Evento */}
            <div className="space-y-2">
                <Label htmlFor="id_subevento">Asociar a Sub-Evento</Label>
                <Select onValueChange={(value) => setValue("id_subevento", parseInt(value), { shouldValidate: true })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un sub-evento..." />
                    </SelectTrigger>
                    <SelectContent>
                        {subeventos.length > 0 ? (
                            subeventos.map(sub => (
                                <SelectItem key={sub.id_subevento} value={String(sub.id_subevento)}>
                                    {sub.nombre}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No hay sub-eventos disponibles sin campaña.
                            </div>
                        )}
                    </SelectContent>
                </Select>
                {errors.id_subevento && <p className="text-red-500 text-sm mt-1">{errors.id_subevento.message}</p>}
            </div>

            {/* Otros campos del formulario */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Campaña</Label>
              <Input id="nombre" {...register("nombre")} autoComplete="off" />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_amigable">URL Amigable (slug)</Label>
              <Input id="url_amigable" {...register("url_amigable")} autoComplete="off" />
              {errors.url_amigable && <p className="text-red-500 text-sm mt-1">{errors.url_amigable.message}</p>}
            </div>
            
            {/* --- CORRECCIÓN: Se elimina el campo 'tipo_acceso' del formulario --- */}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || subeventos.length === 0}>
              {isSubmitting ? "Creando..." : "Crear Campaña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};