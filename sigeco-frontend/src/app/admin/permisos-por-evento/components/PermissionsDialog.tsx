"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Quitamos Input porque ya no se usa
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- INICIO: IMPORT MODIFICADO ---
// (Quitamos getEventos, pero AÑADIMOS apiFetch si no está ya)
import { 
    getUserPermissionsByEvent, 
    upsertUserPermission, 
    deleteUserPermission, 
    apiFetch // <-- ¡IMPORTANTE! O la ruta correcta a tu apiFetch
} from "../../../../lib/api";
// --- FIN: IMPORT MODIFICADO ---

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

interface PermissionPayload {
  // ... (interfaz sin cambios)
  user_id: number;
  event_id: number;
  module: string;
  can_read: 0 | 1;
  can_create: 0 | 1;
  can_update: 0 | 1;
  can_delete: 0 | 1;
}


// --- INICIO: INTERFAZ EVENTO CORREGIDA ---
// (Usando 'nombre' como en tu código de ejemplo)
interface Evento {
  id_evento: number;
  nombre: string;
  // (No necesitamos los otros campos como fecha_fin, estado, etc. 
  // para este diálogo, así que la interfaz simple es suficiente)
}
// --- FIN: INTERFAZ EVENTO CORREGIDA ---


interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User;
}

export function PermissionsDialog({ isOpen, setIsOpen, user }: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);

  // --- INICIO: useEffect REESCRITO USANDO TU LÓGICA ---
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    // 1. Función para cargar permisos (lógica de antes)
    const fetchPermissions = async () => {
      try {
        const res = await getUserPermissionsByEvent(user.id_usuario);
        const data = await res.json();
        if (data.success) {
          const formattedPermissions = data.data.map((p: any) => ({
            event_id: p.event_id,
            module: p.module,
            can_read: !!p.can_read,
            can_create: !!p.can_create,
            can_update: !!p.can_update,
            can_delete: !!p.can_delete,
          }));
          setPermissions(formattedPermissions);
        } else {
          toast.error(data.error || "Error al cargar permisos del usuario.");
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast.error("No se pudieron cargar los permisos del usuario.");
      }
    };

    // 2. Función para cargar eventos (ADAPTADA DE TU CÓDIGO)
    const fetchEventosAdaptada = async () => {
      try {
        // Usamos la llamada apiFetch que ya te funciona
        const response = await apiFetch('/eventos');

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // No necesitamos el mapeo complejo de 'mapEstado' aquí,
            // solo guardamos la data que tiene id_evento y nombre.
            // (Asumimos que data.data es el array de Evento[])
            setEventos(data.data);
          } else {
            // Adaptación: Usamos toast en lugar de setErrorGlobal
            toast.error(data.error || "Error desconocido al obtener los eventos.");
          }
        } else {
          toast.error("Error al obtener los eventos desde el servidor.");
        }
      } catch (error) {
        toast.error("Error de red: No se pudo conectar al servidor de eventos.");
        console.error("Error de red (eventos):", error);
      }
    };

    // 3. Ejecutar ambas y apagar el loading cuando terminen
    const loadAllData = async () => {
      // Promise.all espera a que ambas terminen
      await Promise.all([
        fetchPermissions(),
        fetchEventosAdaptada()
      ]);
      setLoading(false);
    };

    loadAllData();

  }, [user, isOpen]);
  // --- FIN: useEffect REESCRITO ---


  // *** (El resto de funciones NO CAMBIAN) ***
  // handlePermissionChange, handleSavePermission, 
  // handleDeletePermission, handleAddPermission...
  // ...
  const handlePermissionChange = (index: number, field: keyof Permission, value: any) => {
      const newPermissions = [...permissions];
      const permissionToUpdate = { ...newPermissions[index] };
      const key = field as keyof Permission;

      if (key === 'event_id') {
          permissionToUpdate[key] = parseInt(String(value), 10) || 0;
      } else if (key === 'module') {
          permissionToUpdate[key] = String(value);
      } else if (['can_read', 'can_create', 'can_update', 'can_delete'].includes(key)) {
          permissionToUpdate[key] = typeof value === 'boolean' ? value : false;
      }
      newPermissions[index] = permissionToUpdate;
      setPermissions(newPermissions);
  };

  const handleSavePermission = async (index: number) => {
    const currentPermission = permissions[index];
    if (!currentPermission.event_id || currentPermission.event_id <= 0 || !currentPermission.module) {
      toast.error("El ID de Evento (debe ser mayor a 0) y el Módulo son obligatorios.");
      return;
    }
    const payload: PermissionPayload = { 
      user_id: user.id_usuario,
      event_id: currentPermission.event_id,
      module: currentPermission.module,
      can_read: currentPermission.can_read ? 1 : 0,
      can_create: currentPermission.can_create ? 1 : 0,
      can_update: currentPermission.can_update ? 1 : 0,
      can_delete: currentPermission.can_delete ? 1 : 0,
    };
    
    console.log("Payload que se enviará a la API:", payload); 

    try {
      const response = await upsertUserPermission(payload);
       if (!response.ok) {
           let errorMsg = `Error HTTP ${response.status}: ${response.statusText}`;
           try {
               const errorBody = await response.json();
               const errorMessages = errorBody.errors?.map((e: any) => `${e.path}: ${e.msg}`).join('; ') || errorBody.error || 'Error desconocido del servidor.';
               errorMsg = `Error al guardar: ${errorMessages}`;
               console.error("Errores de validación del backend:", errorBody.errors);
           } catch (e) {
               console.error("No se pudo parsear la respuesta de error JSON:", e);
           }
           toast.error(errorMsg);
           return; 
       }

      const result = await response.json();

      if (result.success) {
         toast.success('Permiso guardado.');
      } else {
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

    if (!event_id || event_id <= 0 || !module) {
      handleRemovePermissionRow(index);
      return;
    }

    try {
        const response = await deleteUserPermission(user.id_usuario, event_id, module);
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
        handleRemovePermissionRow(index); 
      } else {
        toast.error(result.error || 'Error al eliminar el permiso desde la API.');
      }
    } catch (error: any) {
       console.error('Error al eliminar permiso:', error);
      toast.error(`Error de red al intentar eliminar: ${error.message}`);
    }
  };

  const handleAddPermission = () => {
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
          {loading ? <p>Cargando permisos y eventos...</p> : (
            <>
              <Table>
                {/* ... (TableHeader sin cambios) ... */}
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
                        <Select
                          value={p.event_id ? String(p.event_id) : ""}
                          onValueChange={(value) => handlePermissionChange(index, 'event_id', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Seleccione un evento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Seleccione un evento</SelectItem>
                            {/* --- INICIO: JSX CORREGIDO --- */}
                            {eventos.map(evento => (
                              <SelectItem 
                                key={evento.id_evento} 
                                value={String(evento.id_evento)}
                              >
                               (ID: {evento.id_evento}) - {evento.nombre} 
                              </SelectItem>
                            ))}
                            {/* --- FIN: JSX CORREGIDO --- */}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={p.module}
                          onValueChange={(value) => handlePermissionChange(index, 'module', value)}
                        >
                          {/* ... (Select de Módulo sin cambios) ... */}
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Seleccione un módulo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eventos">Eventos</SelectItem>
                            <SelectItem value="acreditacion">Acreditacion</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* ... (Checkboxes y Botones sin cambios) ... */}
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