"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getUsuarios, getUserSummary } from "@/lib/api";
import { toast } from "react-hot-toast";
import { PermissionsDialog } from "./PermissionsDialog";

// --- CORRECCIÓN AQUÍ: Definimos una interfaz para el Rol para reutilizarla ---
interface Role {
  id: number;
  name: string;
}

interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  roles?: Role[];
}

export function UserPermissionsList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await getUsuarios();
        const data = await res.json();
        if (data.success) {
          const usuariosConRoles = await Promise.all(
            data.data.map(async (user: User) => {
              const summaryRes = await getUserSummary(user.id_usuario);
              const summaryData = await summaryRes.json();
              return { 
                ...user, 
                roles: summaryData.success ? summaryData.data.roles : [] 
              };
            })
          );

          // --- CORRECCIÓN AQUÍ: Añadimos el tipo explícito para 'role' ---
          const usuariosFiltrados = usuariosConRoles.filter(user => 
            !user.roles?.some((role: Role) => role.name === 'SUPER_ADMIN')
          );

          setUsers(usuariosFiltrados);

        } else {
          toast.error("No se pudieron cargar los usuarios.");
        }
      } catch (error) {
        toast.error("Error al cargar la lista de usuarios.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <>
      {selectedUser && (
        <PermissionsDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          user={selectedUser}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id_usuario}>
                <TableCell className="font-medium">{user.nombre}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    onClick={() => handleManagePermissions(user)}
                  >
                    Gestionar Permisos
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}