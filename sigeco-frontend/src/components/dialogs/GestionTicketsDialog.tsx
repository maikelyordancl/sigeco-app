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
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Estructura de un Ticket
interface Ticket {
  id_tipo_entrada: number;
  nombre: string;
  precio: number;
  cantidad_total: number | null;
  cantidad_vendida: number;
}

type SortOption =
  | "nombre_asc"
  | "nombre_desc"
  | "precio_asc"
  | "precio_desc"
  | "disponibles_asc"
  | "disponibles_desc";

interface TicketsResponse {
  success: boolean;
  data?: Ticket[];
  sort_order?: SortOption;
  error?: string;
  message?: string;
}

// Esquema de validación para el formulario
const ticketSchema = yup.object().shape({
  nombre: yup.string().required("El nombre es obligatorio."),
  precio: yup
    .number()
    .typeError("El precio debe ser un número.")
    .min(0, "El precio no puede ser negativo.")
    .required("El precio es obligatorio."),
  cantidad_total: yup
    .number()
    .nullable()
    .transform((value) =>
      isNaN(value) || value === null || value <= 0 ? null : value
    )
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
  const [savingSort, setSavingSort] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

  const [sortBy, setSortBy] = useState<SortOption>("nombre_asc");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormData>({
    resolver: yupResolver(ticketSchema),
  });

  const fetchTickets = useCallback(async () => {
    if (!id_campana) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/tickets/campana/${id_campana}`);
      const result: TicketsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudieron cargar los tickets.");
      }

      setTickets(Array.isArray(result.data) ? result.data : []);
      setSortBy(result.sort_order || "nombre_asc");
    } catch (err: any) {
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [id_campana]);

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      setEditingTicketId(null);
      reset({ nombre: "", precio: 0, cantidad_total: undefined });
    }
  }, [isOpen, fetchTickets, reset]);

  const handleSortChange = async (value: SortOption) => {
    if (!id_campana || value === sortBy) {
      return;
    }

    const previousSort = sortBy;
    setSortBy(value);
    setSavingSort(true);

    try {
      const response = await apiFetch(`/tickets/campana/${id_campana}/orden`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: value }),
      });

      const result: TicketsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo guardar el orden.");
      }

      setSortBy(result.sort_order || value);
      setTickets(Array.isArray(result.data) ? result.data : []);
      toast.success("Orden de tickets guardado. Este orden también se verá en la landing.");
      onTicketChange();
    } catch (err: any) {
      setSortBy(previousSort);
      toast.error(err.message || "No se pudo guardar el orden.");
    } finally {
      setSavingSort(false);
    }
  };

  const handleSaveTicket = async (data: TicketFormData) => {
    const isEditing = editingTicketId !== null;
    const url = isEditing
      ? `/tickets/${editingTicketId}`
      : `/tickets/campana/${id_campana}`;
    const method = isEditing ? "PUT" : "POST";
    const toastMessage = isEditing
      ? "Actualizando ticket..."
      : "Creando ticket...";

    const toastId = toast.loading(toastMessage);

    try {
      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocurrió un error.");
      }

      toast.success(isEditing ? "Ticket actualizado" : "Ticket creado", {
        id: toastId,
      });

      setEditingTicketId(null);
      reset({ nombre: "", precio: 0, cantidad_total: undefined });
      await fetchTickets();
      onTicketChange();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleEditClick = (ticket: Ticket) => {
    setEditingTicketId(ticket.id_tipo_entrada);
    reset({
      nombre: ticket.nombre,
      precio: ticket.precio,
      cantidad_total: ticket.cantidad_total ?? undefined,
    });
  };

  const cancelEdit = () => {
    setEditingTicketId(null);
    reset({ nombre: "", precio: 0, cantidad_total: undefined });
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;

    const toastId = toast.loading("Eliminando ticket...");

    try {
      const response = await apiFetch(`/tickets/${ticketToDelete.id_tipo_entrada}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el ticket.");
      }

      toast.success("Ticket eliminado con éxito", { id: toastId });
      setTicketToDelete(null);
      await fetchTickets();
      onTicketChange();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Gestionar Tickets
            </DialogTitle>
            <DialogDescription>
              Crea, edita y elimina los tipos de entrada para esta campaña.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            <div className="md:col-span-1 p-4 border rounded-lg h-fit">
              <h3 className="text-lg font-semibold mb-4">
                {editingTicketId ? "Editando Ticket" : "Añadir Nuevo Ticket"}
              </h3>

              <form
                onSubmit={handleSubmit(handleSaveTicket)}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="nombre">Nombre del Ticket</Label>
                  <Input
                    id="nombre"
                    {...register("nombre")}
                    placeholder="Ej: Entrada General"
                  />
                  {errors.nombre && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.nombre.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="precio">Precio (CLP)</Label>
                  <Input
                    id="precio"
                    type="number"
                    {...register("precio")}
                    placeholder="Ej: 25000"
                  />
                  {errors.precio && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.precio.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cantidad_total">Cantidad Total (opcional)</Label>
                  <Input
                    id="cantidad_total"
                    type="number"
                    {...register("cantidad_total")}
                    placeholder="Dejar en blanco para ilimitado"
                  />
                  {errors.cantidad_total && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cantidad_total.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting
                      ? editingTicketId
                        ? "Actualizando..."
                        : "Creando..."
                      : editingTicketId
                      ? "Actualizar Ticket"
                      : "Crear Ticket"}
                  </Button>

                  {editingTicketId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-semibold">Tickets Actuales</h3>
                  <p className="text-sm text-muted-foreground">
                    El orden que definas aquí será el mismo que verá el cliente en la landing.
                  </p>
                </div>

                <div className="w-full sm:w-[280px]">
                  <Select
                    value={sortBy}
                    onValueChange={(value) => handleSortChange(value as SortOption)}
                    disabled={savingSort}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nombre_asc">Nombre A → Z</SelectItem>
                      <SelectItem value="nombre_desc">Nombre Z → A</SelectItem>
                      <SelectItem value="precio_asc">Precio menor → mayor</SelectItem>
                      <SelectItem value="precio_desc">Precio mayor → menor</SelectItem>
                      <SelectItem value="disponibles_asc">
                        Disponibles menor → mayor
                      </SelectItem>
                      <SelectItem value="disponibles_desc">
                        Disponibles mayor → menor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {(loading || savingSort) && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {savingSort ? "Guardando orden..." : "Cargando tickets..."}
                  </div>
                )}

                {!loading && !savingSort && error && (
                  <div className="p-6 text-center text-sm text-red-500">
                    {error}
                  </div>
                )}

                {!loading && !savingSort && !error && (
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
                            <TableCell className="font-medium">
                              {ticket.nombre}
                            </TableCell>

                            <TableCell className="text-right">
                              {formatCurrency(ticket.precio)}
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  ticket.cantidad_total === null
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {ticket.cantidad_total !== null
                                  ? `${ticket.cantidad_total - ticket.cantidad_vendida}`
                                  : "∞"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="mr-2"
                                onClick={() => handleEditClick(ticket)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTicketToDelete(ticket)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            No hay tickets creados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={ticketToDelete !== null}
        onOpenChange={() => setTicketToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás absolutamente seguro?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el ticket{" "}
              <strong>&quot;{ticketToDelete?.nombre}&quot;</strong>. No podrás
              deshacer esta acción.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTicketToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};