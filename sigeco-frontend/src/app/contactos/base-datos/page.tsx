"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";
import { Plus, Trash } from "lucide-react";
import ImportarContactos from "@/app/contactos/components/ImportarContactos";
import FusionarBases from "@/app/contactos/components/FusionarBases";

type BaseDatos = {
  id_base: number;
  nombre: string;
  cantidad_contactos: number;
  origen: string;
  fecha_creado: string;
};

export default function BaseDatosContactos() {
  const [basesDeDatos, setBasesDeDatos] = useState<BaseDatos[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFusionModalOpen, setIsFusionModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [baseToDelete, setBaseToDelete] = useState<BaseDatos | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchBasesDeDatos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/basedatos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setBasesDeDatos(result.data);
        setErrorGlobal(null);
      } else {
        setErrorGlobal(result.error || "Error desconocido al obtener las bases de datos.");
      }
    } catch {
      setErrorGlobal("Error de red al obtener las bases de datos.");
    }
  };

  useEffect(() => {
    fetchBasesDeDatos();
  }, []);

  const handleDeleteBase = async () => {
    if (!baseToDelete) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/basedatos/${baseToDelete.id_base}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Base de datos eliminada con éxito.");
        fetchBasesDeDatos();
        setIsDeleteConfirmOpen(false);
      } else {
        toast.error(result.error || "Error al eliminar la base de datos.");
      }
    } catch {
      toast.error("Error de red al intentar eliminar la base de datos.");
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Bases de Datos de Contactos</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setIsImportModalOpen(true)} className="flex items-center space-x-2">
              <Plus size={20} />
              <span>Importar Contactos</span>
            </Button>
            <Button onClick={() => setIsFusionModalOpen(true)} className="flex items-center space-x-2">
              <Plus size={20} />
              <span>Fusionar Bases</span>
            </Button>
          </div>
        </div>

        {errorGlobal ? (
          <div className="text-red-500 text-center mb-4">{errorGlobal}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {basesDeDatos.map((base) => (
              <Card key={base.id_base} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {base.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Cantidad de Contactos: {base.cantidad_contactos}</p>
                  <p>Origen: {base.origen}</p>
                  <p>Fecha Creación: {new Date(base.fecha_creado).toLocaleDateString("es-ES")}</p>
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setBaseToDelete(base);
                        setIsDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash size={16} /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ImportarContactos open={isImportModalOpen} setOpen={setIsImportModalOpen} refreshContactos={fetchBasesDeDatos} />

        <FusionarBases
          open={isFusionModalOpen}
          setOpen={setIsFusionModalOpen}
          bases={basesDeDatos}
          refresh={fetchBasesDeDatos}
          token={token}
        />

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar esta base de datos?</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteBase}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
