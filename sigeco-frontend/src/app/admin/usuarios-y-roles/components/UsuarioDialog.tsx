"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { createUsuario, updateUsuario } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
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

  useEffect(() => {
    if (user) {
      setNombre(user.nombre);
      setEmail(user.email);
      setPassword('');
    } else {
      setNombre('');
      setEmail('');
      setPassword('');
    }
  }, [user, isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (user) { // Editando
        await updateUsuario(user.id_usuario, { nombre, email });
        toast.success("Usuario actualizado con éxito.");
      } else { // Creando
        await createUsuario({ nombre, email, password });
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
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
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