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

// Esquema de validación para el formulario
const schema = yup.object().shape({
  nombre: yup.string().required("El nombre de la campaña es requerido."),
  tipo_acceso: yup
    .string()
    .oneOf(["Gratuito", "De Pago"])
    .required("El tipo de acceso es requerido."),
  id_subevento: yup
    .number()
    .transform(value => (isNaN(value) ? undefined : value))
    .required("Debes seleccionar un sub-evento.")
    .positive("Debes seleccionar un sub-evento."),
});

type FormData = yup.InferType<typeof schema>;

// Tipo para los sub-eventos que recibimos de la API
interface Subevento {
  id_subevento: number;
  nombre: string;
}

interface CrearSubCampañaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  id_evento: number;
  onSubCampañaCreada: () => void;
}

export const CrearSubCampañaDialog = ({
  isOpen,
  onClose,
  id_evento,
  onSubCampañaCreada,
}: CrearSubCampañaDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subeventos, setSubeventos] = useState<Subevento[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // Efecto que se dispara para buscar los sub-eventos disponibles
  useEffect(() => {
    if (isOpen && id_evento) {
      const fetchSubeventosDisponibles = async () => {
        try {
          const token = localStorage.getItem("token");
          // --- INICIO DE LA CORRECCIÓN ---
          // Usamos la URL correcta de tu API: la que busca subeventos sin campaña.
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/subeventos/evento/${id_evento}/sin-campana`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // --- FIN DE LA CORRECCIÓN ---

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campanas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      onSubCampañaCreada(); // Cierra el modal y refresca la lista
      
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
              <Label htmlFor="tipo_acceso">Tipo de Acceso</Label>
              <Select onValueChange={(value) => setValue("tipo_acceso", value as "Gratuito" | "De Pago", { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo de acceso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="De Pago">De Pago</SelectItem>
                  <SelectItem value="Gratuito">Gratuito</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_acceso && <p className="text-red-500 text-sm mt-1">{errors.tipo_acceso.message}</p>}
            </div>
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