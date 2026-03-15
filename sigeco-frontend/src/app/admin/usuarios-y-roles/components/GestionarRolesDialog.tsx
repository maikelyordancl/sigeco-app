"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { getRoles, assignUserRole, removeUserRole, createRole } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  roles?: { id: number; name: string }[];
}

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
  const [newRoleName, setNewRoleName] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  const fetchRoles = async () => {
    const rolesRes = await getRoles();
    const rolesData = await rolesRes.json();

    if (!rolesRes.ok || !rolesData.success) {
      throw new Error(rolesData.error || "No se pudieron cargar los roles.");
    }

    setAllRoles(rolesData.data);
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        await fetchRoles();
        setUserRoleIds(new Set(user.roles?.map((r) => r.id) || []));
      } catch (error: any) {
        toast.error(error.message || "No se pudieron cargar los roles.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, isOpen]);

  const handleRoleChange = async (roleId: number, isChecked: boolean) => {
    try {
      const response = isChecked
        ? await assignUserRole(user.id_usuario, roleId)
        : await removeUserRole(user.id_usuario, roleId);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo actualizar el rol.");
      }

      if (isChecked) {
        setUserRoleIds((prev) => new Set(prev).add(roleId));
        toast.success("Rol asignado");
      } else {
        setUserRoleIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(roleId);
          return newSet;
        });
        toast.success("Rol quitado");
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar el rol.");
    }
  };

  const handleCreateRole = async () => {
    const roleName = newRoleName.trim();
    if (roleName.length < 2) {
      toast.error("Escribe un nombre de rol válido.");
      return;
    }

    setCreatingRole(true);
    try {
      const response = await createRole(roleName);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo crear el rol.");
      }

      toast.success(result.message || "Rol creado correctamente.");
      setNewRoleName("");
      await fetchRoles();
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear el rol.");
    } finally {
      setCreatingRole(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onSuccess();
        setIsOpen(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Roles de {user.nombre}</DialogTitle>
          <DialogDescription>Asigna, quita o crea roles para este usuario.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Crear nuevo rol</p>
            <div className="flex gap-2">
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Ej. Coordinador"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateRole())}
              />
              <Button onClick={handleCreateRole} disabled={creatingRole}>
                {creatingRole ? "Creando..." : "Crear rol"}
              </Button>
            </div>
          </div>

          {loading ? (
            <p>Cargando roles...</p>
          ) : (
            allRoles.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={userRoleIds.has(role.id)}
                  onCheckedChange={(checked) => handleRoleChange(role.id, !!checked)}
                />
                <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSuccess();
              setIsOpen(false);
            }}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
