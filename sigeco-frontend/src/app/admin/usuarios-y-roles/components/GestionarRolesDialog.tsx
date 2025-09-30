"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { getRoles, assignUserRole, removeUserRole } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  roles?: { id: number, name: string }[];
}

// --- CORRECCIÓN AQUÍ: Ajustada la interfaz para la lista de roles ---
interface Rol {
  id: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: Usuario;
  onSuccess: () => void;
}

export function GestionarRolesDialog({ isOpen, setIsOpen, user, onSuccess }: Props) {
  const [allRoles, setAllRoles] = useState<Rol[]>([]);
  const [userRoleIds, setUserRoleIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const rolesRes = await getRoles();
        const rolesData = await rolesRes.json();
        if (rolesData.success) {
          setAllRoles(rolesData.data);
        }
        
        setUserRoleIds(new Set(user.roles?.map(r => r.id) || []));

      } catch (error) {
        toast.error("No se pudieron cargar los roles.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user, isOpen]);

  const handleRoleChange = async (roleId: number, isChecked: boolean) => {
    try {
        if (isChecked) {
            await assignUserRole(user.id_usuario, roleId);
            setUserRoleIds(prev => new Set(prev).add(roleId));
            toast.success("Rol asignado");
        } else {
            await removeUserRole(user.id_usuario, roleId);
            setUserRoleIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(roleId);
                return newSet;
            });
            toast.success("Rol quitado");
        }
    } catch {
        toast.error("No se pudo actualizar el rol.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if(!open) onSuccess();
      setIsOpen(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Roles de {user.nombre}</DialogTitle>
          <DialogDescription>Asigna o quita roles para este usuario.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* --- CORRECCIÓN AQUÍ: Se usa role.id y role.name --- */}
          {loading ? <p>Cargando roles...</p> : allRoles.map(role => (
            <div key={role.id} className="flex items-center space-x-2">
              <Checkbox
                id={`role-${role.id}`}
                checked={userRoleIds.has(role.id)}
                onCheckedChange={(checked) => handleRoleChange(role.id, !!checked)}
              />
              <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => {
            onSuccess();
            setIsOpen(false);
          }}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}