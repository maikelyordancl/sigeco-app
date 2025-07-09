"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";
import { Plus, Trash, Pencil, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Contacto } from "../types/contacto";
import ContactoForm from "@/app/contactos/components/ContactoForm";

export default function GestionContactos() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [contactoToDelete, setContactoToDelete] = useState<Contacto | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalContactos, setTotalContactos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const contactosPorPagina = 15;

  // Función para obtener los contactos con búsqueda y paginación
  const fetchContactos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      // La URL ahora incluye parámetros para paginación y búsqueda
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/contactos`);
      url.searchParams.append('page', paginaActual.toString());
      url.searchParams.append('limit', contactosPorPagina.toString());
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setContactos(result.data.contactos);
        setTotalContactos(result.data.total);
        setTotalPaginas(result.data.total_paginas);
        setErrorGlobal(null);
      } else {
        setErrorGlobal(result.error || "Error desconocido al obtener los contactos.");
      }
    } catch (error) {
      setErrorGlobal("Error de red: No se pudo conectar al servidor.");
      console.error("Error de red:", error);
    }
  }, [paginaActual, contactosPorPagina, searchTerm]); // Dependencias actualizadas

  useEffect(() => {
    fetchContactos();
  }, [fetchContactos]);

  // Manejo de cambios en el buscador
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPaginaActual(1); // Reiniciar a la página 1 en cada nueva búsqueda
  };

  const handleOpenModal = (contacto?: Contacto) => {
    setSelectedContacto(contacto || null);
    setIsModalOpen(true);
  };

  const handleDeleteContacto = async () => {
    if (!contactoToDelete) return;

    try {
      const token = localStorage.getItem("token");
      // La URL ahora incluye el ID directamente en la ruta, como espera el backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contactos/${contactoToDelete.id_contacto}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Contacto eliminado con éxito.");
        setIsDeleteConfirmOpen(false);
        setContactoToDelete(null);
        fetchContactos(); // Refrescar la lista para reflejar la eliminación
      } else {
        toast.error(result.error || "Error al eliminar el contacto.");
      }
    } catch (error) {
      toast.error("Error de red al intentar eliminar el contacto.");
    }
  };

  return (
    <MainLayout title="Gestión de Contactos">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Contactos</h1>
          <Button onClick={() => { setSelectedContacto(null); setIsModalOpen(true); }} className="flex items-center space-x-2">
            <Plus size={20} />
            <span>Agregar Contacto</span>
          </Button>
        </div>

        {/* Buscador y contador de registros */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
            />
            <Button variant="outline">
              <Search size={20} />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Total:</span>
            <span className="bg-blue-500 text-white font-semibold px-3 py-1 rounded-md">
              {totalContactos}
            </span>
          </div>
        </div>

        {errorGlobal ? (
          <div className="text-red-500 text-center mb-4">{errorGlobal}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactos.map((contacto) => (
              <Card key={contacto.id_contacto} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {contacto.nombre} {contacto.apellido}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Email: {contacto.email}</p>
                  <p>Teléfono: {contacto.telefono}</p>
                  <p>Empresa: {contacto.empresa || "N/A"}</p>
                  <div className="mt-4 flex justify-between">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(contacto)}>
                      <Pencil size={16} /> Ver / Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setContactoToDelete(contacto);
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

        {/* Paginación */}
        <div className="flex justify-center items-center space-x-4 mt-6">
          <Button
            variant="outline"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          >
            <ChevronLeft size={20} /> Anterior
          </Button>
          <span>Página {paginaActual} de {totalPaginas}</span>
          <Button
            variant="outline"
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
          >
            Siguiente <ChevronRight size={20} />
          </Button>
        </div>

        <ContactoForm
          open={isModalOpen}
          setOpen={setIsModalOpen}
          contacto={selectedContacto}
          refreshContactos={fetchContactos}
        />

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar contacto?</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteContacto}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
