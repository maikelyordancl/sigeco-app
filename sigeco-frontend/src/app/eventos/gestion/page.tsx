"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";

import { 
  Plus, Calendar, MapPin, Search, Megaphone, Edit, Trash2, FolderArchive, 
  LayoutGrid, List, ChevronLeft, ChevronRight 
} from "lucide-react";
import { GestionArchivosDialog } from "@/components/dialogs/GestionArchivosDialog";

import { EstadoEvento, Evento, estadosEvento } from "./types";
import { mapEstado, reverseMapEstado, getBadgeColor } from "./utils";
import { apiFetch } from "@/lib/api";

type ViewMode = 'grid' | 'list';

const validationSchema = Yup.object().shape({
  id_evento: Yup.number().optional(),
  nombre: Yup.string().required("El nombre del evento es obligatorio."),
  fecha_inicio: Yup.string().required("La fecha de inicio es obligatoria."),
  fecha_fin: Yup.string()
    .required("La fecha de finalización es obligatoria.")
    .test("is-after", "La finalización debe ser posterior a la de inicio.", function (value) {
      const { fecha_inicio } = this.parent;
      return new Date(value) > new Date(fecha_inicio);
    }),
  ciudad: Yup.string().required("La ciudad es obligatoria."),
  lugar: Yup.string().required("El lugar del evento es obligatorio."),
  presupuesto_marketing: Yup.number().optional(),
  estado: Yup.string().oneOf(estadosEvento, "Estado no válido.").required("El estado es obligatorio."),
});

export default function GestionEventos() {
  const router = useRouter();
  
  // Estados de datos
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  
  // Estados de UI y Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoEvento | "Todos">("Activo"); // Activos por defecto
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Estados de Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [eventosPorPagina, setEventosPorPagina] = useState(12);

  // Estados de Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isArchivosModalOpen, setIsArchivosModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Estados auxiliares
  const [eventoParaArchivos, setEventoParaArchivos] = useState<Evento | null>(null);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [presupuesto, setPresupuesto] = useState("");

  // Recordar vista seleccionada (Grid o Lista)
  useEffect(() => {
    const savedView = localStorage.getItem('eventosViewMode') as ViewMode;
    if (savedView) setViewMode(savedView);
  }, []);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('eventosViewMode', mode);
  };

  useEffect(() => {
    if (selectedEvento?.presupuesto_marketing !== undefined) {
      setPresupuesto(new Intl.NumberFormat("es-CL").format(selectedEvento.presupuesto_marketing ?? 0));
    }
  }, [selectedEvento]);

  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPresupuesto(new Intl.NumberFormat("es-CL").format(Number(value)));
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Evento>({
    resolver: yupResolver(validationSchema),
    defaultValues: selectedEvento || {
      id_evento: 0,
      nombre: "",
      fecha_inicio: "",
      fecha_fin: "",
      ciudad: "",
      lugar: "",
      presupuesto_marketing: 0,
      estado: "Activo",
    },
  });

  useEffect(() => {
    if (selectedEvento) reset(selectedEvento);
  }, [selectedEvento, reset]);

  const fetchEventos = useCallback(async () => {
    try {
      const response = await apiFetch('/eventos');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const eventosMapeados = data.data.map((evento: Evento) => ({
            id_evento: evento.id_evento,
            nombre: evento.nombre,
            fecha_inicio: evento.fecha_inicio,
            fecha_fin: evento.fecha_fin,
            ciudad: evento.ciudad,
            lugar: evento.lugar,
            presupuesto_marketing: evento.presupuesto_marketing,
            estado: mapEstado(Number(evento.estado)),
          }));
          setEventos(eventosMapeados);
          setErrorGlobal(null);
        } else {
          setErrorGlobal(data.error || "Error desconocido al obtener los eventos.");
        }
      } else {
        setErrorGlobal("Error al obtener los eventos desde el servidor.");
      }
    } catch (error) {
      setErrorGlobal("Error de red: No se pudo conectar al servidor.");
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN LOCAL ---
  const eventosFiltrados = useMemo(() => {
    let filtrados = eventos;

    // 1. Filtrar por Estado
    if (estadoFiltro !== "Todos") {
      filtrados = filtrados.filter((e) => e.estado === estadoFiltro);
    }

    // 2. Filtrar por Búsqueda (Texto)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter((e) =>
        e.nombre.toLowerCase().includes(term) ||
        e.ciudad.toLowerCase().includes(term) ||
        e.lugar.toLowerCase().includes(term) ||
        String(e.id_evento).includes(term)
      );
    }

    // 3. Ordenar
    return filtrados.sort((a, b) => {
      const prioridadEstado: Record<EstadoEvento, number> = {
        "Activo": 1,
        "En Proceso": 2,
        "Finalizado": 3,
        "Cancelado": 4,
      };
      if (prioridadEstado[a.estado] === prioridadEstado[b.estado]) {
        return (b.id_evento || 0) - (a.id_evento || 0); // Los más nuevos primero
      }
      return prioridadEstado[a.estado] - prioridadEstado[b.estado];
    });
  }, [eventos, estadoFiltro, searchTerm]);

  // Cálculos de Paginación
  const totalPaginas = Math.ceil(eventosFiltrados.length / eventosPorPagina) || 1;
  const eventosPaginados = eventosFiltrados.slice(
    (paginaActual - 1) * eventosPorPagina,
    paginaActual * eventosPorPagina
  );

  // Reiniciar a la página 1 si cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, estadoFiltro, eventosPorPagina]);

  const handleEventosPorPaginaChange = (value: string) => {
    setEventosPorPagina(Number(value));
  };
  // ----------------------------------------------

  const handleOpenModal = (evento?: Evento) => {
    setSelectedEvento(evento || {
      id_evento: 0,
      nombre: "",
      fecha_inicio: "",
      fecha_fin: "",
      ciudad: "",
      lugar: "",
      presupuesto_marketing: 0,
      estado: "Activo",
    });
    setPresupuesto(new Intl.NumberFormat("es-CL").format(evento ? evento.presupuesto_marketing ?? 0 : 0));
    setErrorModal(null);
    setIsModalOpen(true);
  };
  
  const handleOpenArchivosModal = (evento: Evento) => {
    setEventoParaArchivos(evento);
    setIsArchivosModalOpen(true);
  };

  const handleSaveEvento = async (data: Evento) => {
    const isEditing = !!data.id_evento;
    const url = isEditing ? `/eventos?id=${data.id_evento}` : `/eventos`;
    const metodo = isEditing ? "PUT" : "POST";

    const presupuestoNumerico = Number(presupuesto.replace(/\./g, ""));

    const payload = {
      nombre: data.nombre,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      ciudad: data.ciudad,
      lugar: data.lugar,
      presupuesto_marketing: presupuestoNumerico,
      estado: reverseMapEstado(data.estado),
    };

    try {
      const response = await apiFetch(url, {
        method: metodo,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsModalOpen(false);
        toast.success(isEditing ? "Evento actualizado con éxito." : "Evento creado con éxito.");
        await fetchEventos();
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((err: any) => toast.error(err.msg, { duration: 2500 }));
        } else {
          toast.error(result.error || "Ocurrió un error al guardar el evento.");
        }
      }
    } catch (error) {
      toast.error("Error de red al intentar guardar el evento.");
    }
  };

  const handleDeleteEvento = async () => {
    if (!eventoToDelete) return;
  
    try {
      const response = await apiFetch(`/eventos/${eventoToDelete.id_evento}`, { method: "DELETE" });
      const result = await response.json();
  
      if (response.ok && result.success) {
        toast.success("Evento eliminado con éxito.");
        setIsDeleteConfirmOpen(false);
        setEventoToDelete(null);
        await fetchEventos();
      } else {
        toast.error(result.error || "Error al eliminar el evento.");
      }
    } catch (error) {
      toast.error("Error de red al intentar eliminar el evento.");
    }
  };

  return (
    <MainLayout title="Gestión de Eventos">
      <div className="p-6">
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Eventos</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
            <Plus size={20} />
            <span>Crear Evento</span>
          </Button>
        </div>

        {/* BARRA DE FILTROS SUPERIOR (ESTADOS) */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["Todos", "Activo", "En Proceso", "Finalizado", "Cancelado"].map((estado) => (
            <Button
              key={estado}
              variant={estadoFiltro === estado ? "default" : "outline"}
              onClick={() => setEstadoFiltro(estado as any)}
              size="sm"
              className={estadoFiltro === estado ? "shadow-md" : ""}
            >
              {estado}
            </Button>
          ))}
        </div>

        {/* BARRA DE BÚSQUEDA Y CONTROLES (Estilo Contactos) */}
        <div className="flex justify-between items-center mb-6 gap-4 bg-white p-3 rounded-md border shadow-sm flex-wrap">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div className="flex flex-1 items-center space-x-2 max-w-md">
              <Input
                placeholder="Buscar por nombre, ciudad o lugar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50"
              />
              <Button variant="outline" size="icon"><Search size={18} /></Button>
            </div>
            
            {/* Toggle Grid/List */}
            <div className="flex items-center space-x-1 rounded-md border bg-slate-100 p-1">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSetViewMode('grid')}>
                <LayoutGrid size={16} />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSetViewMode('list')}>
                <List size={16} />
              </Button>
            </div>

            {/* Eventos por página */}
            <Select value={String(eventosPorPagina)} onValueChange={handleEventosPorPaginaChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 / página</SelectItem>
                <SelectItem value="24">24 / página</SelectItem>
                <SelectItem value="50">50 / página</SelectItem>
                <SelectItem value="100">100 / página</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600 font-medium">Total filtrados:</span>
            <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-md">
              {eventosFiltrados.length}
            </span>
          </div>
        </div>

        {/* MANEJO DE ERRORES */}
        {errorGlobal && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-center mb-6 font-medium shadow-sm">
            {errorGlobal}
          </div>
        )}

        {/* ÁREA DE CONTENIDO */}
        {!errorGlobal && eventosFiltrados.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
             <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
             <h3 className="text-lg font-medium text-slate-900">No se encontraron eventos</h3>
             <p className="text-slate-500">Prueba cambiando los filtros de búsqueda o estado.</p>
           </div>
        ) : (
          <>
            {/* VISTA GRID (TARJETAS) */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {eventosPaginados.map((evento) => (
                  <Card key={evento.id_evento} className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="pb-3 bg-slate-50 border-b">
                      <CardTitle className="flex justify-between items-start gap-2">
                        <span className="text-lg font-bold text-slate-800 leading-tight">
                          <span className="text-xs text-slate-400 block mb-1">ID: {evento.id_evento}</span>
                          {evento.nombre}
                        </span>
                        <Badge className={getBadgeColor(evento.estado)}>{evento.estado}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3 mb-5 text-sm">
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="bg-blue-100 p-1.5 rounded text-blue-700"><Calendar size={16} /></div>
                          <span className="font-medium">
                            {new Date(evento.fecha_inicio).toLocaleDateString("es-ES")} <span className="text-slate-400 mx-1">al</span> {new Date(evento.fecha_fin).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="bg-amber-100 p-1.5 rounded text-amber-700"><MapPin size={16} /></div>
                          <span className="font-medium">{evento.ciudad} <span className="text-slate-400">·</span> {evento.lugar}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" className="w-full text-slate-700" onClick={() => handleOpenModal(evento)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          <Button size="sm" variant="secondary" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => router.push(`/eventos/${evento.id_evento}/campanas`)}>
                              <Megaphone className="mr-2 h-4 w-4" /> Campañas
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-slate-700" onClick={() => handleOpenArchivosModal(evento)}>
                              <FolderArchive className="mr-2 h-4 w-4" /> Archivos
                          </Button>
                          {/* Botón de Eliminar pequeño y cuadrado (size="icon") */}
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" 
                            onClick={() => { setEventoToDelete(evento); setIsDeleteConfirmOpen(true); }} 
                            disabled 
                            title="Eliminar Evento"
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* VISTA LISTA (TABLA) */}
            {viewMode === 'list' && (
              <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                      <TableHead className="w-[80px] font-bold">ID</TableHead>
                      <TableHead className="font-bold">Nombre del Evento</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="font-bold">Fechas</TableHead>
                      <TableHead className="font-bold">Ubicación</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventosPaginados.map((evento) => (
                      <TableRow key={evento.id_evento}>
                        <TableCell className="font-medium text-slate-500">{evento.id_evento}</TableCell>
                        <TableCell className="font-bold text-slate-800">{evento.nombre}</TableCell>
                        <TableCell>
                          <Badge className={getBadgeColor(evento.estado)}>{evento.estado}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                           {new Date(evento.fecha_inicio).toLocaleDateString("es-ES")} - {new Date(evento.fecha_fin).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {evento.ciudad}, {evento.lugar}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" title="Editar Evento" onClick={() => handleOpenModal(evento)}>
                              <Edit className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Button size="icon" variant="secondary" title="Ir a Campañas" className="bg-blue-50 hover:bg-blue-100" onClick={() => router.push(`/eventos/${evento.id_evento}/campanas`)}>
                                <Megaphone className="h-4 w-4 text-blue-700" />
                            </Button>
                            <Button size="icon" variant="outline" title="Gestionar Archivos" onClick={() => handleOpenArchivosModal(evento)}>
                                <FolderArchive className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Button size="icon" variant="outline" title="Eliminar Evento" className="text-red-500 hover:bg-red-50" onClick={() => { setEventoToDelete(evento); setIsDeleteConfirmOpen(true); }} disabled>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* PAGINACIÓN INFERIOR */}
            <div className="flex justify-center items-center space-x-4 mt-8">
              <Button
                variant="outline"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft size={20} className="mr-1" /> Anterior
              </Button>
              <span className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-md border">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
              >
                Siguiente <ChevronRight size={20} className="ml-1" />
              </Button>
            </div>
          </>
        )}

        {/* MODAL CREAR/EDITAR EVENTO */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedEvento?.id_evento ? "Editar Evento" : "Crear Nuevo Evento"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleSaveEvento)} className="space-y-4 mt-2">
                {(errorModal || Object.keys(errors).length > 0) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                    {errorModal && <p>{errorModal}</p>}
                    {errors.nombre && <p>• {errors.nombre.message}</p>}
                    {errors.fecha_inicio && <p>• {errors.fecha_inicio.message}</p>}
                    {errors.fecha_fin && <p>• {errors.fecha_fin.message}</p>}
                    {errors.ciudad && <p>• {errors.ciudad.message}</p>}
                    {errors.lugar && <p>• {errors.lugar.message}</p>}
                  </div>
                )}
                
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Nombre del Evento</label>
                <Input {...register("nombre")} placeholder="Ej. Congreso Anual de Tecnología" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Fecha de Inicio</label>
                  <Input type="date" {...register("fecha_inicio")} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Fecha de Fin</label>
                  <Input type="date" {...register("fecha_fin")} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Ciudad</label>
                  <Input {...register("ciudad")} placeholder="Ej. Santiago" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Lugar / Recinto</label>
                  <Input {...register("lugar")} placeholder="Ej. Espacio Riesco" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Presupuesto MKT ($)</label>
                  <Input
                      type="text"
                      value={presupuesto}
                      onChange={handlePresupuestoChange}
                      placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Estado</label>
                  <Select
                      {...register("estado")}
                      value={selectedEvento?.estado}
                      onValueChange={(value) => setSelectedEvento((prev) => prev ? { ...prev, estado: value as EstadoEvento } : null)}
                      disabled={!selectedEvento?.id_evento}
                  >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosEvento.map((estado) => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Guardar Evento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* MODAL DE ARCHIVOS */}
        <GestionArchivosDialog 
            isOpen={isArchivosModalOpen}
            onClose={() => setIsArchivosModalOpen(false)}
            evento={eventoParaArchivos}
        />

        {/* MODAL DE ELIMINACIÓN */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Eliminar Evento</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-slate-700">
              <p>¿Estás seguro de que deseas eliminar este evento y todo lo asociado a él?</p>
              <p className="font-bold mt-2">{eventoToDelete?.nombre}</p>
              <p className="text-sm text-red-500 mt-2 italic">Esta acción no se puede deshacer.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteEvento}>Sí, Eliminar Evento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}