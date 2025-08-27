"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { AsignarContactosDialog } from "../components/AsignarContactosDialog";
import { BaseDatos, Contacto } from "../types/contacto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";
import { Plus, Trash, Pencil, ChevronLeft, ChevronRight, Search, Database, LayoutGrid, List } from "lucide-react";
import ContactoForm from "@/app/contactos/components/ContactoForm";
import { apiFetch } from "@/lib/api";
import { ContactosTable } from "../components/ContactosTable"; 

type ViewMode = 'grid' | 'list';

function GestionContactosContent() {
  const searchParams = useSearchParams();
  const showSinBase = searchParams.get('sin-base') === 'true';

  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [basesDeDatos, setBasesDeDatos] = useState<BaseDatos[]>([]);
  const [selectedContactos, setSelectedContactos] = useState<number[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [contactoToDelete, setContactoToDelete] = useState<Contacto | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    const savedView = localStorage.getItem('contactosViewMode') as ViewMode;
    if (savedView) {
      setViewMode(savedView);
    }
  }, []);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('contactosViewMode', mode);
  };

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalContactos, setTotalContactos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [contactosPorPagina, setContactosPorPagina] = useState(50);

  const handleContactosPorPaginaChange = (value: string) => {
    setContactosPorPagina(Number(value));
    setPaginaActual(1); // Reset page to 1 when changing limit
  };

  const fetchContactos = useCallback(async () => {
    try {
      let endpoint = '';
      if (showSinBase) {
        endpoint = '/contactos/sin-base';
      } else {
        const params = new URLSearchParams({
          page: paginaActual.toString(),
          limit: contactosPorPagina.toString(),
        });
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        endpoint = `/contactos?${params.toString()}`;
      }
      
      const response = await apiFetch(endpoint);
      const result = await response.json();

      if (result.success) {
        if (showSinBase) {
            setContactos(result.data);
            setTotalContactos(result.data.length);
            setTotalPaginas(1);
        } else {
            setContactos(result.data.contactos);
            setTotalContactos(result.data.total);
            setTotalPaginas(result.data.total_paginas);
        }
        setErrorGlobal(null);
      } else {
        setErrorGlobal(result.error || "Error al obtener los contactos.");
      }
    } catch (error) {
      setErrorGlobal("Error de red: No se pudo conectar al servidor.");
      console.error("Error de red:", error);
    }
  }, [paginaActual, contactosPorPagina, searchTerm, showSinBase]);

  const fetchBasesDeDatos = useCallback(async () => {
      try {
          const response = await apiFetch('/basedatos');
          const result = await response.json();
          if (result.success) {
              setBasesDeDatos(result.data);
          }
      } catch (error) {
          console.error("No se pudieron cargar las bases de datos para el diálogo.");
      }
  }, []);

  useEffect(() => {
    fetchContactos();
    fetchBasesDeDatos();
  }, [fetchContactos, fetchBasesDeDatos]);
  
  const handleToggleSelectContacto = (id: number) => {
    setSelectedContactos((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContactos(contactos.map(c => c.id_contacto));
    } else {
      setSelectedContactos([]);
    }
  };

  const handleOpenModal = (contacto?: Contacto) => {
    setSelectedContacto(contacto || null);
    setIsModalOpen(true);
  };

  const handleDeleteConfirmation = (contacto: Contacto) => {
    setContactoToDelete(contacto);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteContacto = async () => {
    if (!contactoToDelete) return;

    try {
      const response = await apiFetch(`/contactos/${contactoToDelete.id_contacto}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Contacto eliminado con éxito.");
        setIsDeleteConfirmOpen(false);
        setContactoToDelete(null);
        fetchContactos();
        setSelectedContactos(prev => prev.filter(id => id !== contactoToDelete.id_contacto));
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
          <h1 className="text-3xl font-bold">{showSinBase ? "Contactos sin Asignar" : "Gestión de Contactos"}</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
            <Plus size={20} />
            <span>Agregar Contacto</span>
          </Button>
        </div>

        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center space-x-2">
            {!showSinBase && (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Buscar contactos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <Button variant="outline"><Search size={20} /></Button>
              </div>
            )}
            <div className="flex items-center space-x-1 rounded-md border bg-slate-100 p-1">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSetViewMode('grid')}>
                <LayoutGrid size={16} />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSetViewMode('list')}>
                <List size={16} />
              </Button>
            </div>
            {!showSinBase && (
              <div className="flex items-center space-x-2">
                  <Select value={String(contactosPorPagina)} onValueChange={handleContactosPorPaginaChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Registros por página" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 / página</SelectItem>
                      <SelectItem value="50">50 / página</SelectItem>
                      <SelectItem value="100">100 / página</SelectItem>
                      <SelectItem value="200">200 / página</SelectItem>
                      <SelectItem value="500">500 / página</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-auto">
            {selectedContactos.length > 0 && (
              <Button onClick={() => setIsAssignModalOpen(true)}>
                <Database size={16} className="mr-2" />
                Asignar ({selectedContactos.length})
              </Button>
            )}
            <span className="text-gray-600">Total:</span>
            <span className="bg-blue-500 text-white font-semibold px-3 py-1 rounded-md">
              {totalContactos}
            </span>
          </div>
        </div>

        {errorGlobal ? (
          <div className="text-red-500 text-center mb-4">{errorGlobal}</div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                    id="select-all"
                    checked={selectedContactos.length === contactos.length && contactos.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
                <label htmlFor="select-all">Seleccionar todos los visibles ({selectedContactos.length})</label>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contactos.map((contacto) => (
                  <Card key={contacto.id_contacto} className={`shadow-md hover:shadow-lg transition-shadow relative ${selectedContactos.includes(contacto.id_contacto) ? 'border-blue-500 border-2' : ''}`}>
                    <div className="absolute top-2 right-2">
                        <Checkbox
                            checked={selectedContactos.includes(contacto.id_contacto)}
                            onCheckedChange={() => handleToggleSelectContacto(contacto.id_contacto)}
                        />
                    </div>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {contacto.nombre}
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
                          onClick={() => handleDeleteConfirmation(contacto)}
                        >
                          <Trash size={16} /> Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <ContactosTable
                contactos={contactos}
                selectedContactos={selectedContactos}
                onSelectContacto={handleToggleSelectContacto}
                onSelectAll={handleSelectAll}
                onEdit={handleOpenModal}
                onDelete={handleDeleteConfirmation}
              />
            )}
          </>
        )}

        {!showSinBase && (
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
        )}

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
        
        <AsignarContactosDialog
            open={isAssignModalOpen}
            setOpen={setIsAssignModalOpen}
            contactIds={selectedContactos}
            basesDeDatos={basesDeDatos}
            onAsignacionCompleta={() => {
                setIsAssignModalOpen(false);
                setSelectedContactos([]);
                fetchContactos();
            }}
        />

      </div>
    </MainLayout>
  );
}

export default function GestionContactos() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <GestionContactosContent />
    </Suspense>
  );
}