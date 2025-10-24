"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// 1. Importar componentes de Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
// 2. Importar getRoles
import { createUsuario, updateUsuario, getRoles } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
}

// 3. Definir tipo para los roles
interface Role {
  id_role: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: Usuario | null;
  onSuccess: () => void;
}

export function UsuarioDialog({ isOpen, setIsOpen, user, onSuccess }: Props) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 4. Estados para los roles
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      // Editando
      setNombre(user.nombre);
      setEmail(user.email);
      setPassword('');
      setSelectedRole(undefined); // La gestión de roles se hace en el otro diálogo
    } else {
      // Creando
      setNombre('');
      setEmail('');
      setPassword('');
      setSelectedRole(undefined);
      
      // 5. Cargar roles disponibles al abrir para crear
      const fetchRoles = async () => {
        if (isOpen) {
          try {
            const res = await getRoles();
            const data = await res.json();
            if (data.success) {
              setAvailableRoles(data.data);
            }
          } catch (e) {
            toast.error("No se pudieron cargar los roles.");
          }
        }
      };
      fetchRoles();
    }
  }, [user, isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (user) { // Editando
        await updateUsuario(user.id_usuario, { nombre, email });
        toast.success("Usuario actualizado con éxito.");
      } else { // Creando
        // 6. Añadir role_id (opcional) a la data
        const role_id = selectedRole ? parseInt(selectedRole, 10) : undefined;
        await createUsuario({ nombre, email, password, role_id });
        toast.success("Usuario creado con éxito.");
      }
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      toast.error(`No se pudo ${user ? 'actualizar' : 'crear'} el usuario.`);
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
          
          {/* 7. Mostrar campos solo al crear */}
          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              
              {/* 8. Selector de Rol */}
              <div className="space-y-2">
                <Label htmlFor="role">Rol Inicial (Opcional)</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sin rol inicial" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Opción para "ninguno" */}
                    <SelectItem value="undefined">Sin rol inicial</SelectItem>
                    
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id_role} value={String(role.id_role)}>
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}