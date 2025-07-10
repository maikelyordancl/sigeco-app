"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

// Estructura de un Ticket
interface Ticket {
  id_tipo_entrada: number;
  nombre: string;
  precio: number;
  cantidad_total: number | null;
  cantidad_vendida: number;
}

// Esquema de validación para el formulario
const ticketSchema = yup.object().shape({
  nombre: yup.string().required("El nombre es obligatorio."),
  precio: yup.number()
    .typeError("El precio debe ser un número.")
    .min(0, "El precio no puede ser negativo.")
    .required("El precio es obligatorio."),
  cantidad_total: yup.number()
    .nullable()
    .transform((value) => (isNaN(value) || value === null || value <= 0) ? null : value)
    .optional(),
});

type TicketFormData = yup.InferType<typeof ticketSchema>;

interface GestionTicketsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  id_campana: number | null;
  onTicketChange: () => void;
}

export const GestionTicketsDialog = ({
  isOpen,
  onClose,
  id_campana,
  onTicketChange,
}: GestionTicketsDialogProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 1. NUEVOS ESTADOS PARA EDITAR Y ELIMINAR ---
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormData>({
    resolver: yupResolver(ticketSchema),
  });

  // Función para obtener los tickets (sin cambios)
  const fetchTickets = useCallback(async () => {
    if (!id_campana) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/campana/${id_campana}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("No se pudieron cargar los tickets.");
      const result = await response.json();
      if (result.success) setTickets(result.data);
      else throw new Error(result.error || "Error al procesar la respuesta.");
    } catch (err: any) {
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [id_campana]);

  // useEffect para cargar datos y resetear estados al abrir
  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      setEditingTicketId(null);
      reset({ nombre: '', precio: 0, cantidad_total: undefined });
    }
  }, [isOpen, fetchTickets, reset]);

  // --- 2. FUNCIÓN DE GUARDADO GENÉRICA (CREAR Y ACTUALIZAR) ---
  const handleSaveTicket = async (data: TicketFormData) => {
    const isEditing = editingTicketId !== null;
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API_URL}/tickets/${editingTicketId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/tickets/campana/${id_campana}`;
    const method = isEditing ? "PUT" : "POST";
    const toastMessage = isEditing ? "Actualizando ticket..." : "Creando ticket...";

    const toastId = toast.loading(toastMessage);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Ocurrió un error.");

      toast.success(isEditing ? "Ticket actualizado" : "Ticket creado", { id: toastId });
      setEditingTicketId(null);
      reset({ nombre: '', precio: 0, cantidad_total: undefined });
      fetchTickets();
      onTicketChange();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };
  
  // --- 3. FUNCIÓN PARA INICIAR LA EDICIÓN ---
  const handleEditClick = (ticket: Ticket) => {
    setEditingTicketId(ticket.id_tipo_entrada);
    reset(ticket); // Carga los datos del ticket en el formulario
  };

  // --- 4. FUNCIÓN PARA CANCELAR LA EDICIÓN ---
  const cancelEdit = () => {
    setEditingTicketId(null);
    reset({ nombre: '', precio: 0, cantidad_total: undefined });
  };
  
  // --- 5. FUNCIÓN PARA ELIMINAR UN TICKET ---
  const handleDeleteTicket = async () => {
      if (!ticketToDelete) return;
      const toastId = toast.loading("Eliminando ticket...");
      try {
          const token = localStorage.getItem("token");
          const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketToDelete.id_tipo_entrada}`,
              { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
          );
          if (!response.ok) throw new Error("Error al eliminar el ticket.");

          toast.success("Ticket eliminado con éxito", { id: toastId });
          setTicketToDelete(null); // Cierra el diálogo de confirmación
          fetchTickets();
          onTicketChange();
      } catch (err: any) {
          toast.error(err.message, { id: toastId });
      }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Gestionar Tickets</DialogTitle>
            <DialogDescription>
              Crea, edita y elimina los tipos de entrada para esta campaña.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            {/* Columna Izquierda: Formulario */}
            <div className="md:col-span-1 p-4 border rounded-lg h-fit">
              <h3 className="text-lg font-semibold mb-4">
                {editingTicketId ? "Editando Ticket" : "Añadir Nuevo Ticket"}
              </h3>
              <form onSubmit={handleSubmit(handleSaveTicket)} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Ticket</Label>
                  <Input id="nombre" {...register("nombre")} placeholder="Ej: Entrada General" />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <Label htmlFor="precio">Precio (CLP)</Label>
                  <Input id="precio" type="number" {...register("precio")} placeholder="Ej: 25000" />
                  {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cantidad_total">Cantidad Total (opcional)</Label>
                  <Input id="cantidad_total" type="number" {...register("cantidad_total")} placeholder="Dejar en blanco para ilimitado" />
                  {errors.cantidad_total && <p className="text-red-500 text-sm mt-1">{errors.cantidad_total.message}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (editingTicketId ? "Actualizando..." : "Creando...") : (editingTicketId ? "Actualizar Ticket" : "Crear Ticket")}
                    </Button>
                    {editingTicketId && (
                        <Button type="button" variant="ghost" size="icon" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
              </form>
            </div>

            {/* Columna Derecha: Lista de Tickets */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-3">Tickets Actuales</h3>
              <div className="border rounded-lg overflow-hidden">
                {!loading && !error && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-center">Disponibles</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.length > 0 ? (
                        tickets.map((ticket) => (
                          <TableRow key={ticket.id_tipo_entrada}>
                            <TableCell className="font-medium">{ticket.nombre}</TableCell>
                            <TableCell className="text-right">{formatCurrency(ticket.precio)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={ticket.cantidad_total === null ? "default" : "secondary"}>
                                {ticket.cantidad_total !== null ? `${ticket.cantidad_total - ticket.cantidad_vendida}` : '∞'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleEditClick(ticket)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setTicketToDelete(ticket)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">No hay tickets creados.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- 6. DIÁLOGO DE CONFIRMACIÓN PARA ELIMINAR --- */}
      <AlertDialog open={ticketToDelete !== null} onOpenChange={() => setTicketToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción eliminará permanentemente el ticket <strong>"{ticketToDelete?.nombre}"</strong>. No podrás deshacer esta acción.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTicketToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-600 hover:bg-red-700">
                    Sí, eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};