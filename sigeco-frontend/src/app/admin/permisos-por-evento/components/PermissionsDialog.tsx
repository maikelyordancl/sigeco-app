"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { getUserPermissionsByEvent, upsertUserPermission, deleteUserPermission } from "@/lib/api";
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
          const formattedPermissions = data.data.map((p: any) => ({
            ...p,
            can_read: !!p.can_read,
            can_create: !!p.can_create,
            can_update: !!p.can_update,
            can_delete: !!p.can_delete,
          }));
          setPermissions(formattedPermissions);
        }
      } catch (error) {
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
    (permissionToUpdate as any)[field] = value;
    newPermissions[index] = permissionToUpdate;
    setPermissions(newPermissions);
  };

  const handleSavePermission = async (index: number) => {
    const permission = { ...permissions[index], user_id: user.id_usuario };

    if (!permission.event_id || !permission.module) {
      toast.error("El ID de Evento y el Módulo son obligatorios.");
      return;
    }

    try {
      await upsertUserPermission(permission);
      toast.success('Permiso guardado.');
    } catch (error) {
      toast.error('Error al guardar el permiso.');
    }
  };
  
  const handleRemovePermissionRow = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };
  
  const handleDeletePermission = async (index: number) => {
    const { event_id, module } = permissions[index];

    if (!event_id || !module) {
      handleRemovePermissionRow(index);
      return;
    }

    try {
      await deleteUserPermission(user.id_usuario, event_id, module);
      toast.success('Permiso eliminado.');
      handleRemovePermissionRow(index);
    } catch (error) {
      toast.error('Error al eliminar el permiso.');
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
        <div className="py-4">
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
                    <TableHead className="w-40">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((p, index) => (
                    <TableRow key={index}>
                      <TableCell><Input type="number" value={p.event_id === 0 ? '' : p.event_id} onChange={(e) => handlePermissionChange(index, 'event_id', parseInt(e.target.value) || 0)} className="w-24" /></TableCell>
                      <TableCell><Input placeholder="ej: acreditacion" value={p.module} onChange={(e) => handlePermissionChange(index, 'module', e.target.value)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_read} onCheckedChange={(c) => handlePermissionChange(index, 'can_read', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_create} onCheckedChange={(c) => handlePermissionChange(index, 'can_create', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_update} onCheckedChange={(c) => handlePermissionChange(index, 'can_update', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_delete} onCheckedChange={(c) => handlePermissionChange(index, 'can_delete', c)} /></TableCell>
                      <TableCell className="space-x-2">
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