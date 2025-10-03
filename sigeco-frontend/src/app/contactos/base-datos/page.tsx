"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast"; // ✅ IMPORT CORRECTO
import MainLayout from "@/components/Layout/MainLayout";
import { Plus, Trash, Users } from "lucide-react";
import { BaseDatos } from "@/app/contactos/types/contacto";
import ImportarContactos from "@/app/contactos/components/ImportarContactos";
import FusionarBases from "@/app/contactos/components/FusionarBases";
import { apiFetch } from "@/lib/api";

export default function BaseDatosContactos() {
  const router = useRouter();
  const [basesDeDatos, setBasesDeDatos] = useState<BaseDatos[]>([]);
  const [contactosSinBaseCount, setContactosSinBaseCount] = useState<number>(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFusionModalOpen, setIsFusionModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [baseToDelete, setBaseToDelete] = useState<BaseDatos | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const fetchBasesDeDatos = useCallback(async () => {
    try {
      const responseBases = await apiFetch(`/basedatos`);
      const resultBases = await responseBases.json();

      if (resultBases.success) {
        setBasesDeDatos(resultBases.data);
        setErrorGlobal(null);
      } else {
        setErrorGlobal(resultBases.error || "Error desconocido al obtener las bases de datos.");
      }

      const responseOrphaned = await apiFetch("/contactos/sin-base");
      const resultOrphaned = await responseOrphaned.json();
      if (resultOrphaned.success && Array.isArray(resultOrphaned.data)) {
        setContactosSinBaseCount(resultOrphaned.data.length);
      }
    } catch {
      setErrorGlobal("Error de red al obtener los datos.");
    }
  }, []);

  useEffect(() => {
    fetchBasesDeDatos();
  }, [fetchBasesDeDatos]);

  const handleDeleteBase = async () => {
    if (!baseToDelete) return;
    try {
      const response = await apiFetch(`/basedatos/${baseToDelete.id_base}`, { method: "DELETE" });
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

  const tokenForChildren = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
            <Card
              className="shadow-md hover:shadow-lg transition-shadow border-dashed border-2 cursor-pointer bg-gray-50/50"
              onClick={() => router.push("/contactos/gestion?sin-base=true")}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-gray-700">
                  Contactos sin Asignar
                  <Users size={20} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Cantidad de Contactos: {contactosSinBaseCount}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Contactos que no pertenecen a ninguna base de datos.
                </p>
              </CardContent>
            </Card>

            {basesDeDatos.map((base) => (
              <Card key={base.id_base} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">{base.nombre}</CardTitle>
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

        <ImportarContactos
          open={isImportModalOpen}
          setOpen={setIsImportModalOpen}
          refreshContactos={fetchBasesDeDatos}
        />

        <FusionarBases
          open={isFusionModalOpen}
          setOpen={setIsFusionModalOpen}
          bases={basesDeDatos}
          refresh={fetchBasesDeDatos}
          token={tokenForChildren}
        />

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar esta base de datos?</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteBase}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
