"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// CORRECCIÓN: Importamos getUserSummary que sí habla con el backend correctamente
import { getUsuarios, deleteUsuario, getUserSummary } from "@/lib/api";
import { toast } from "react-hot-toast";
import { UsuarioDialog } from "./UsuarioDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { GestionarRolesDialog } from "./GestionarRolesDialog";

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  roles?: { id: number, name: string }[];
}

export function UsuariosTable() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const usersRes = await getUsuarios();
      const usersData = await usersRes.json();
      
      if (!usersData.success) {
        toast.error("No se pudieron cargar los usuarios.");
        setLoading(false);
        return;
      }
      
      const usuariosConRolesDetallados = await Promise.all(
        usersData.data.map(async (user: any) => {
            // --- CORRECCIÓN AQUÍ: Usamos la función importada 'getUserSummary' ---
            const summaryRes = await getUserSummary(user.id_usuario);
            const summaryData = await summaryRes.json();
            return { 
              ...user, 
              roles: summaryData.success ? summaryData.data.roles : [] 
            };
        })
      );

      setUsuarios(usuariosConRolesDetallados);

    } catch (error) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: Usuario) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };
  
  const handleManageRoles = (user: Usuario) => {
    setSelectedUser(user);
    setIsRolesDialogOpen(true);
  };

  const handleDelete = async (id_usuario: number) => {
    try {
      const res = await deleteUsuario(id_usuario);
      const data = await res.json();
      if (data.success) {
        toast.success("Usuario eliminado con éxito.");
        fetchUsuarios();
      } else {
        toast.error(data.message || "No se pudo eliminar el usuario.");
      }
    } catch (error) {
      toast.error("No se pudo eliminar el usuario.");
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate}>Crear Usuario</Button>
      </div>

      <UsuarioDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        user={selectedUser}
        onSuccess={fetchUsuarios}
      />
      
      {selectedUser && <GestionarRolesDialog
        isOpen={isRolesDialogOpen}
        setIsOpen={setIsRolesDialogOpen}
        user={selectedUser}
        onSuccess={fetchUsuarios}
      />}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id_usuario}>
                <TableCell>{user.nombre}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.roles?.map(r => r.name).join(', ') || 'Sin rol'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleManageRoles(user)}>Roles</Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>Editar</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Eliminar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente al usuario.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user.id_usuario)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}