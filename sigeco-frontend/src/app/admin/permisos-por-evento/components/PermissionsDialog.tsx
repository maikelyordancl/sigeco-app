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

  // *** FUNCIÓN CORREGIDA ***
  const handlePermissionChange = (index: number, field: keyof Permission, value: any) => {
      const newPermissions = [...permissions];
      // Crear una copia mutable del permiso específico
      const permissionToUpdate = { ...newPermissions[index] };

      // Clave para acceder dinámicamente a las propiedades
      const key = field as keyof Permission;

      if (key === 'event_id') {
          // Convertir el valor del input (string) a número, o 0 si no es válido
          permissionToUpdate[key] = parseInt(String(value), 10) || 0;
      } else if (key === 'module') {
          // Asignar el valor del input (string) directamente
          permissionToUpdate[key] = String(value);
      } else if (['can_read', 'can_create', 'can_update', 'can_delete'].includes(key)) {
          // El valor 'value' de onCheckedChange ya debería ser booleano (true/false)
          // Asignarlo directamente, asegurando que sea booleano, si no, default a false
          permissionToUpdate[key] = typeof value === 'boolean' ? value : false;
      }

      // Actualizar el permiso en la copia del array
      newPermissions[index] = permissionToUpdate;
      // Actualizar el estado
      setPermissions(newPermissions);
  };
  // *** FIN CORRECCIÓN ***


  const handleSavePermission = async (index: number) => {
    // Obtener el permiso actual directamente del estado
    const currentPermission = permissions[index];

    // Validación básica en el frontend
    if (!currentPermission.event_id || currentPermission.event_id <= 0 || !currentPermission.module) {
      toast.error("El ID de Evento (debe ser mayor a 0) y el Módulo son obligatorios.");
      return;
    }

    // *** PASO CRÍTICO: Conversión de Booleanos a Números (0 o 1) ***
    // Crear el objeto payload que se enviará a la API
    const payload: PermissionPayload = { // Usar la interfaz específica para el payload
      user_id: user.id_usuario,
      event_id: currentPermission.event_id,
      module: currentPermission.module,
      can_read: currentPermission.can_read ? 1 : 0,     // true -> 1, false -> 0
      can_create: currentPermission.can_create ? 1 : 0, // true -> 1, false -> 0
      can_update: currentPermission.can_update ? 1 : 0, // true -> 1, false -> 0
      can_delete: currentPermission.can_delete ? 1 : 0, // true -> 1, false -> 0
    };
    // *** FIN DEL PASO CRÍTICO ***

    console.log("Payload que se enviará a la API:", payload); // Verifica en la consola que aquí se vean 0s y 1s

    try {
      // Enviar el payload con números (0 o 1) a la API
      const response = await upsertUserPermission(payload);
      // Verificar si la respuesta es OK antes de intentar parsear JSON
       if (!response.ok) {
           // Intentar obtener el mensaje de error del cuerpo si existe
           let errorMsg = `Error HTTP ${response.status}: ${response.statusText}`;
           try {
               const errorBody = await response.json();
               const errorMessages = errorBody.errors?.map((e: any) => `${e.path}: ${e.msg}`).join('; ') || errorBody.error || 'Error desconocido del servidor.';
               errorMsg = `Error al guardar: ${errorMessages}`;
               console.error("Errores de validación del backend:", errorBody.errors);
           } catch (e) {
               // Si no se puede parsear el cuerpo JSON, usar el status text
               console.error("No se pudo parsear la respuesta de error JSON:", e);
           }
           toast.error(errorMsg);
           return; // Salir si la respuesta no fue exitosa
       }

      const result = await response.json();

      if (result.success) {
         toast.success('Permiso guardado.');
         // Opcional: Recargar permisos si la API no devuelve el objeto actualizado
         // fetchPermissions();
      } else {
         // Este bloque podría no alcanzarse si manejamos !response.ok arriba, pero lo dejamos por si acaso
         const errorMessages = result.errors?.map((e: any) => `${e.path}: ${e.msg}`).join('; ') || result.error || 'Error desconocido del servidor.';
         toast.error(`Error al guardar: ${errorMessages}`);
         console.error("Errores de validación del backend:", result.errors);
      }
    } catch (error: any) {
        console.error('Error en fetch al guardar permiso:', error);
        toast.error(`Error de red al intentar guardar: ${error.message}`);
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
        // Verificar si la respuesta es OK
         if (!response.ok) {
             let errorMsg = `Error HTTP ${response.status}: ${response.statusText}`;
             try {
                 const errorBody = await response.json();
                 errorMsg = errorBody.error || 'Error al eliminar el permiso desde la API.';
             } catch (e) {
                  console.error("No se pudo parsear la respuesta de error JSON al eliminar:", e);
             }
             toast.error(errorMsg);
             return;
         }

        const result = await response.json();

      if(result.success) {
        toast.success('Permiso eliminado.');
        handleRemovePermissionRow(index); // Quitar la fila de la UI después de confirmar la eliminación
      } else {
         // Podría no alcanzarse si manejamos !response.ok arriba
        toast.error(result.error || 'Error al eliminar el permiso desde la API.');
      }
    } catch (error: any) {
       console.error('Error al eliminar permiso:', error);
      toast.error(`Error de red al intentar eliminar: ${error.message}`);
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
                      <TableCell>
                        <Input
                          type="number"
                          value={p.event_id <= 0 ? '' : p.event_id}
                           // Pasar e.target.value directamente
                          onChange={(e) => handlePermissionChange(index, 'event_id', e.target.value)}
                          className="w-24"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="ej: acreditacion"
                          value={p.module}
                           // Pasar e.target.value directamente
                          onChange={(e) => handlePermissionChange(index, 'module', e.target.value)}
                        />
                      </TableCell>
                       {/* Pasar 'c' (CheckedState) directamente */}
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

