"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { createUsuario, updateUsuario, getRoles } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
}

interface Role {
  id: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: Usuario | null;
  onSuccess: () => void;
}

const ROLE_NONE = "__none__";

export function UsuarioDialog({ isOpen, setIsOpen, user, onSuccess }: Props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>(ROLE_NONE);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles();
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "No se pudieron cargar los roles.");
        }
        setAvailableRoles(data.data);
      } catch (e: any) {
        toast.error(e.message || "No se pudieron cargar los roles.");
      }
    };

    if (user) {
      setNombre(user.nombre);
      setEmail(user.email);
      setPassword("");
      setSelectedRole(ROLE_NONE);
    } else {
      setNombre("");
      setEmail("");
      setPassword("");
      setSelectedRole(ROLE_NONE);
      if (isOpen) {
        fetchRoles();
      }
    }
  }, [user, isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (user) {
        const response = await updateUsuario(user.id_usuario, { nombre, email });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "No se pudo actualizar el usuario.");
        }

        toast.success("Usuario actualizado con éxito.");
      } else {
        const role_id = selectedRole !== ROLE_NONE ? parseInt(selectedRole, 10) : undefined;
        const payload = {
          nombre,
          email,
          password,
          ...(role_id ? { role_id } : {}),
        };

        const response = await createUsuario(payload);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "No se pudo crear el usuario.");
        }

        toast.success("Usuario creado con éxito.");
      }

      onSuccess();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || `No se pudo ${user ? "actualizar" : "crear"} el usuario.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol Inicial (Opcional)</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sin rol inicial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLE_NONE}>Sin rol inicial</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
