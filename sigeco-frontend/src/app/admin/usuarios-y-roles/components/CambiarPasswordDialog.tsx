"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { updatePassword } from "@/lib/api"; // Importar la nueva función
import { toast } from "react-hot-toast";

interface Usuario {
  id_usuario: number;
  nombre: string;
}

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: Usuario | null;
  onSuccess: () => void;
}

export function CambiarPasswordDialog({ isOpen, setIsOpen, user, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Limpiar password al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user) return;
    
    // Validación simple en el front
    if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    setLoading(true);
    try {
      // Llamar a la API
      await updatePassword(user.id_usuario, password);
      toast.success(`Contraseña de ${user.nombre} actualizada.`);
      onSuccess(); // Llamar al callback (aunque no recargue la lista)
      setIsOpen(false);
    } catch (error) {
      toast.error("No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
        </DialogHeader>
        <p>Estás modificando la contraseña para <strong>{user?.nombre}</strong>.</p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}