"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import { findUsers, getUserPermissionsByEvent, upsertUserPermission, deleteUserPermission } from '@/lib/api';
import { Trash2 } from 'lucide-react';

interface User {
  id_usuario: number;
  nombre: string;
  email: string;
}

interface Permission {
  event_id: number;
  module: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export function PermisosTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.length < 3) {
      toast.error('Ingresa al menos 3 caracteres para buscar.');
      return;
    }
    setIsSearching(true);
    try {
      const res = await findUsers(searchTerm);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setUsers(data.data);
      } else {
        setUsers([]);
        toast.error(data.message || 'No se encontraron usuarios.');
      }
    } catch (error) {
      toast.error('Error al buscar usuarios.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setLoading(true);
    setUsers([]); // Ocultar la lista de búsqueda
    try {
      const res = await getUserPermissionsByEvent(user.id_usuario);
      const data = await res.json();
      if (data.success) {
        // Aseguramos que los valores booleanos sean correctos (1/0 a true/false)
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
      toast.error('No se pudo obtener los permisos del usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (index: number, field: keyof Permission, value: any) => {
    const newPermissions = [...permissions];
    const permissionToUpdate = { ...newPermissions[index] };
    (permissionToUpdate as any)[field] = value;
    newPermissions[index] = permissionToUpdate;
    setPermissions(newPermissions);
  };

  const handleSavePermission = async (index: number) => {
    if (!selectedUser) return;
    const permission = { ...permissions[index], user_id: selectedUser.id_usuario };
    
    // Validaciones básicas
    if (!permission.event_id || !permission.module) {
        toast.error("El ID de Evento y el Módulo son obligatorios.");
        return;
    }

    try {
      const res = await upsertUserPermission(permission);
      const data = await res.json();
      if (data.success) {
        toast.success('Permiso guardado con éxito.');
      } else {
        toast.error(data.message || 'No se pudo guardar el permiso.');
      }
    } catch (error) {
      toast.error('Error de conexión al guardar el permiso.');
    }
  };

  const handleRemovePermissionRow = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const handleDeletePermission = async (index: number) => {
    if (!selectedUser) return;
    const { event_id, module } = permissions[index];

    // Si el evento o módulo no existen, es una fila nueva sin guardar, solo la removemos
    if (!event_id || !module) {
        handleRemovePermissionRow(index);
        return;
    }

    try {
      const res = await deleteUserPermission(selectedUser.id_usuario, event_id, module);
      const data = await res.json();
      if (data.success) {
        toast.success('Permiso eliminado de la base de datos.');
        handleRemovePermissionRow(index);
      } else {
        toast.error(data.message || 'No se pudo eliminar el permiso.');
      }
    } catch (error) {
      toast.error('Error de conexión al eliminar el permiso.');
    }
  };

  const handleAddPermission = () => {
    setPermissions([...permissions, { event_id: 0, module: '', can_read: false, can_create: false, can_update: false, can_delete: false }]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Buscar Usuario</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={!!selectedUser}
          />
          {selectedUser ? (
            <Button variant="outline" onClick={() => { setSelectedUser(null); setPermissions([]); setSearchTerm(''); }}>Limpiar</Button>
          ) : (
            <Button onClick={handleSearch} disabled={isSearching}>{isSearching ? 'Buscando...' : 'Buscar'}</Button>
          )}
        </CardContent>
      </Card>
      
      {users.length > 0 && !selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {users.map(user => (
                <li key={user.id_usuario} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleSelectUser(user)}>
                  <span>{user.nombre} ({user.email})</span>
                  <Button size="sm" variant="outline">Seleccionar</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>2. Gestionar Permisos para: {selectedUser.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p>Cargando permisos...</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Evento</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-center">Leer</TableHead>
                    <TableHead className="text-center">Crear</TableHead>
                    <TableHead className="text-center">Actualizar</TableHead>
                    <TableHead className="text-center">Eliminar</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((p, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input type="number" value={p.event_id === 0 ? '' : p.event_id} onChange={(e) => handlePermissionChange(index, 'event_id', parseInt(e.target.value) || 0)} className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Input value={p.module} onChange={(e) => handlePermissionChange(index, 'module', e.target.value)} />
                      </TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_read} onCheckedChange={(c) => handlePermissionChange(index, 'can_read', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_create} onCheckedChange={(c) => handlePermissionChange(index, 'can_create', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_update} onCheckedChange={(c) => handlePermissionChange(index, 'can_update', c)} /></TableCell>
                      <TableCell className="text-center"><Checkbox checked={p.can_delete} onCheckedChange={(c) => handlePermissionChange(index, 'can_delete', c)} /></TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" onClick={() => handleSavePermission(index)}>Guardar</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePermission(index)}><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={handleAddPermission} className="mt-4">Añadir Fila de Permiso</Button>
            </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}