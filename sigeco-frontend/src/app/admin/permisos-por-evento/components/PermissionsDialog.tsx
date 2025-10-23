"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
// Corregido: Usar ruta relativa en lugar de alias
import { getUserPermissionsByEvent, upsertUserPermission, deleteUserPermission } from "../../../../lib/api";
import { Trash2 } from "lucide-react";

interface User {
  id_usuario: number;
  nombre: string;
}

interface Permission {
  event_id: number;
  module: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

// Interface para el payload que espera la API
interface PermissionPayload {
  user_id: number;
  event_id: number;
  module: string;
  can_read: 0 | 1;
  can_create: 0 | 1;
  can_update: 0 | 1;
  can_delete: 0 | 1;
}


interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User;
}

export function PermissionsDialog({ isOpen, setIsOpen, user }: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const res = await getUserPermissionsByEvent(user.id_usuario);
        const data = await res.json();
        if (data.success) {
          // Asegurarse de que los permisos se lean como booleanos desde la API
          const formattedPermissions = data.data.map((p: any) => ({
            event_id: p.event_id,
            module: p.module,
            can_read: !!p.can_read, // Convierte a booleano
            can_create: !!p.can_create, // Convierte a booleano
            can_update: !!p.can_update, // Convierte a booleano
            can_delete: !!p.can_delete, // Convierte a booleano
          }));
          setPermissions(formattedPermissions);
        } else {
            // Si la API devuelve success: false, mostrar el error
            toast.error(data.error || "Error al cargar permisos.");
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast.error("No se pudieron cargar los permisos del usuario.");
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, isOpen]);

  const handlePermissionChange = (index: number, field: keyof Permission, value: any) => {
    const newPermissions = [...permissions];
    const permissionToUpdate = { ...newPermissions[index] };

    // El valor de los Checkbox viene directamente como booleano o 'indeterminate'
    // Aseguramos que siempre sea booleano aquí
    (permissionToUpdate as any)[field] = typeof value === 'boolean' ? value : !!value;

    newPermissions[index] = permissionToUpdate;
    setPermissions(newPermissions);
  };

  const handleSavePermission = async (index: number) => {
    const currentPermission = permissions[index]; // Obtener el permiso del estado (con booleanos)

    // Validación básica en el frontend
    if (!currentPermission.event_id || currentPermission.event_id <= 0 || !currentPermission.module) {
      toast.error("El ID de Evento (debe ser mayor a 0) y el Módulo son obligatorios.");
      return;
    }

    // Crear el objeto payload para enviar a la API, convirtiendo booleanos a números (0 o 1)
    const payload: PermissionPayload = {
      user_id: user.id_usuario,
      event_id: currentPermission.event_id,
      module: currentPermission.module,
      can_read: currentPermission.can_read ? 1 : 0,
      can_create: currentPermission.can_create ? 1 : 0,
      can_update: currentPermission.can_update ? 1 : 0,
      can_delete: currentPermission.can_delete ? 1 : 0,
    };

    console.log("Enviando payload:", payload); // Para depuración

    try {
      // Enviar el payload transformado a la API
      const response = await upsertUserPermission(payload);
      const result = await response.json();

      if (result.success) {
         toast.success('Permiso guardado.');
         // Podrías recargar los permisos si es necesario actualizar la vista
         // fetchPermissions();
      } else {
         // Mostrar errores de validación del backend si existen
         const errorMessages = result.errors?.map((e: any) => e.msg).join(', ') || result.error || 'Error desconocido del servidor.';
         toast.error(`Error al guardar: ${errorMessages}`);
      }
    } catch (error: any) {
        console.error('Error al guardar permiso:', error);
        // Intentar mostrar un mensaje más específico si la API lo envía
        let errorMessage = 'Error al guardar el permiso.';
         if (error.message) {
             errorMessage = error.message;
         }
       toast.error(errorMessage);
    }
  };

  const handleRemovePermissionRow = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const handleDeletePermission = async (index: number) => {
    const { event_id, module } = permissions[index];

    // Si la fila es nueva y no tiene event_id o module válidos, solo quitarla del estado
    if (!event_id || event_id <= 0 || !module) {
      handleRemovePermissionRow(index);
      return;
    }

    // Si es un permiso existente, llamar a la API para eliminar
    try {
        const response = await deleteUserPermission(user.id_usuario, event_id, module);
        const result = await response.json();

      if(result.success) {
        toast.success('Permiso eliminado.');
        handleRemovePermissionRow(index); // Quitar la fila de la UI después de confirmar la eliminación
      } else {
        toast.error(result.error || 'Error al eliminar el permiso desde la API.');
      }
    } catch (error) {
       console.error('Error al eliminar permiso:', error);
      toast.error('Error de red al intentar eliminar el permiso.');
    }
  };

  const handleAddPermission = () => {
    // Añadir una nueva fila con valores por defecto (booleanos false e id 0)
    setPermissions([...permissions, { event_id: 0, module: '', can_read: false, can_create: false, can_update: false, can_delete: false }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Permisos para {user.nombre}</DialogTitle>
          <DialogDescription>Añade, edita o elimina permisos para eventos específicos.</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? <p>Cargando permisos...</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Evento</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-center w-16">Leer</TableHead>
                    <TableHead className="text-center w-16">Crear</TableHead>
                    <TableHead className="text-center w-16">Actualizar</TableHead>
                    <TableHead className="text-center w-16">Eliminar</TableHead>
                    <TableHead className="w-40 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((p, index) => (
                    <TableRow key={index}>
                      <TableCell><Input type="number" value={p.event_id <= 0 ? '' : p.event_id} onChange={(e) => handlePermissionChange(index, 'event_id', parseInt(e.target.value) || 0)} className="w-24" min="1" /></TableCell>
                      <TableCell><Input placeholder="ej: acreditacion" value={p.module} onChange={(e) => handlePermissionChange(index, 'module', e.target.value)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_read} onCheckedChange={(c) => handlePermissionChange(index, 'can_read', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_create} onCheckedChange={(c) => handlePermissionChange(index, 'can_create', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_update} onCheckedChange={(c) => handlePermissionChange(index, 'can_update', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_delete} onCheckedChange={(c) => handlePermissionChange(index, 'can_delete', c)} /></TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button size="sm" onClick={() => handleSavePermission(index)}>Guardar</Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDeletePermission(index)}><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={handleAddPermission} variant="outline" className="mt-4">Añadir Fila</Button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

