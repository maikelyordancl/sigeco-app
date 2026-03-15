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
  Plus,
  Calendar,
  MapPin,
  Search,
  Megaphone,
  Edit,
  Trash2,
  FolderArchive,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { GestionArchivosDialog } from "@/components/dialogs/GestionArchivosDialog";

import { EstadoEvento, Evento, estadosEvento } from "./types";
import { mapEstado, reverseMapEstado, getBadgeColor } from "./utils";
import { apiFetch } from "@/lib/api";

type ViewMode = "grid" | "list";

const nullableUrlField = Yup.string()
  .nullable()
  .transform((value) => (value === "" ? null : value))
  .test("nullable-url", "Debe ser una URL válida.", (value) => !value || Yup.string().url().isValidSync(value));

const nullableEmailField = Yup.string()
  .nullable()
  .transform((value) => (value === "" ? null : value))
  .email("Debe ser un correo válido.");

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
  link_drive: nullableUrlField,
  contacto_1_nombre: Yup.string().nullable().optional(),
  contacto_1_email: nullableEmailField,
  contacto_1_telefono: Yup.string().nullable().optional(),
  contacto_2_nombre: Yup.string().nullable().optional(),
  contacto_2_email: nullableEmailField,
  contacto_2_telefono: Yup.string().nullable().optional(),
});

const emptyToNull = (value?: string | null) => {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed ? trimmed : null;
};

const hasContactData = (evento: Evento, contactNumber: 1 | 2) => {
  const prefix = contactNumber === 1 ? "contacto_1" : "contacto_2";
  return Boolean(
    (evento as any)[`${prefix}_nombre`] ||
      (evento as any)[`${prefix}_email`] ||
      (evento as any)[`${prefix}_telefono`]
  );
};

const ContactBlock = ({
  title,
  nombre,
  email,
  telefono,
}: {
  title: string;
  nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
}) => {
  if (!nombre && !email && !telefono) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="space-y-1 text-sm text-slate-700">
        {nombre && (
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <span>{nombre}</span>
          </div>
        )}
        {email && (
          <div className="flex items-start gap-2 break-all">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <span>{email}</span>
          </div>
        )}
        {telefono && (
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <span>{telefono}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function GestionEventos() {
  const router = useRouter();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoEvento | "Todos">("Activo");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [paginaActual, setPaginaActual] = useState(1);
  const [eventosPorPagina, setEventosPorPagina] = useState(12);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isArchivosModalOpen, setIsArchivosModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [eventoParaArchivos, setEventoParaArchivos] = useState<Evento | null>(null);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [presupuesto, setPresupuesto] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Evento>({
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
      link_drive: "",
      contacto_1_nombre: "",
      contacto_1_email: "",
      contacto_1_telefono: "",
      contacto_2_nombre: "",
      contacto_2_email: "",
      contacto_2_telefono: "",
    },
  });

  useEffect(() => {
    const savedView = localStorage.getItem("eventosViewMode") as ViewMode;
    if (savedView) setViewMode(savedView);
  }, []);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("eventosViewMode", mode);
  };

  useEffect(() => {
    if (selectedEvento?.presupuesto_marketing !== undefined) {
      setPresupuesto(new Intl.NumberFormat("es-CL").format(selectedEvento.presupuesto_marketing ?? 0));
    }
  }, [selectedEvento]);

  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPresupuesto(new Intl.NumberFormat("es-CL").format(Number(value || 0)));
  };

  useEffect(() => {
    if (selectedEvento) reset(selectedEvento);
  }, [selectedEvento, reset]);

  const fetchEventos = useCallback(async () => {
    try {
      const response = await apiFetch("/eventos");
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
            link_drive: evento.link_drive,
            contacto_1_nombre: evento.contacto_1_nombre,
            contacto_1_email: evento.contacto_1_email,
            contacto_1_telefono: evento.contacto_1_telefono,
            contacto_2_nombre: evento.contacto_2_nombre,
            contacto_2_email: evento.contacto_2_email,
            contacto_2_telefono: evento.contacto_2_telefono,
          }));
          setEventos(eventosMapeados);
          setErrorGlobal(null);
        } else {
          setErrorGlobal(data.error || "Error desconocido al obtener los eventos.");
        }
      } else {
        setErrorGlobal("Error al obtener los eventos desde el servidor.");
      }
    } catch (_error) {
      setErrorGlobal("Error de red: No se pudo conectar al servidor.");
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const eventosFiltrados = useMemo(() => {
    let filtrados = eventos;

    if (estadoFiltro !== "Todos") {
      filtrados = filtrados.filter((e) => e.estado === estadoFiltro);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter((e) =>
        [
          e.nombre,
          e.ciudad,
          e.lugar,
          e.link_drive,
          e.contacto_1_nombre,
          e.contacto_1_email,
          e.contacto_1_telefono,
          e.contacto_2_nombre,
          e.contacto_2_email,
          e.contacto_2_telefono,
          String(e.id_evento),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      );
    }

    return filtrados.sort((a, b) => {
      const prioridadEstado: Record<EstadoEvento, number> = {
        Activo: 1,
        "En Proceso": 2,
        Finalizado: 3,
        Cancelado: 4,
      };
      if (prioridadEstado[a.estado] === prioridadEstado[b.estado]) {
        return (b.id_evento || 0) - (a.id_evento || 0);
      }
      return prioridadEstado[a.estado] - prioridadEstado[b.estado];
    });
  }, [eventos, estadoFiltro, searchTerm]);

  const totalPaginas = Math.ceil(eventosFiltrados.length / eventosPorPagina) || 1;
  const eventosPaginados = eventosFiltrados.slice(
    (paginaActual - 1) * eventosPorPagina,
    paginaActual * eventosPorPagina
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, estadoFiltro, eventosPorPagina]);

  const handleEventosPorPaginaChange = (value: string) => {
    setEventosPorPagina(Number(value));
  };

  const handleOpenModal = (evento?: Evento) => {
    const eventoBase: Evento = evento || {
      id_evento: 0,
      nombre: "",
      fecha_inicio: "",
      fecha_fin: "",
      ciudad: "",
      lugar: "",
      presupuesto_marketing: 0,
      estado: "Activo",
      link_drive: "",
      contacto_1_nombre: "",
      contacto_1_email: "",
      contacto_1_telefono: "",
      contacto_2_nombre: "",
      contacto_2_email: "",
      contacto_2_telefono: "",
    };

    setSelectedEvento(eventoBase);
    reset(eventoBase);
    setValue("estado", eventoBase.estado);
    setPresupuesto(new Intl.NumberFormat("es-CL").format(eventoBase.presupuesto_marketing ?? 0));
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
      link_drive: emptyToNull(data.link_drive),
      contacto_1_nombre: emptyToNull(data.contacto_1_nombre),
      contacto_1_email: emptyToNull(data.contacto_1_email),
      contacto_1_telefono: emptyToNull(data.contacto_1_telefono),
      contacto_2_nombre: emptyToNull(data.contacto_2_nombre),
      contacto_2_email: emptyToNull(data.contacto_2_email),
      contacto_2_telefono: emptyToNull(data.contacto_2_telefono),
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
      } else if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach((err: any) => toast.error(err.msg, { duration: 2500 }));
      } else {
        toast.error(result.error || "Ocurrió un error al guardar el evento.");
      }
    } catch (_error) {
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
    } catch (_error) {
      toast.error("Error de red al intentar eliminar el evento.");
    }
  };

  return (
    <MainLayout title="Gestión de Eventos">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestión de Eventos</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
            <Plus size={20} />
            <span>Crear Evento</span>
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
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

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border bg-white p-3 shadow-sm">
          <div className="flex w-full flex-1 items-center gap-3 md:w-auto">
            <div className="flex max-w-md flex-1 items-center space-x-2">
              <Input
                placeholder="Buscar por nombre, ciudad, lugar, drive o contactos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50"
              />
              <Button variant="outline" size="icon">
                <Search size={18} />
              </Button>
            </div>

            <div className="flex items-center space-x-1 rounded-md border bg-slate-100 p-1">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => handleSetViewMode("grid")}>
                <LayoutGrid size={16} />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => handleSetViewMode("list")}>
                <List size={16} />
              </Button>
            </div>

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
            <span className="font-medium text-gray-600">Total filtrados:</span>
            <span className="rounded-md bg-blue-600 px-3 py-1 font-bold text-white">{eventosFiltrados.length}</span>
          </div>
        </div>

        {errorGlobal && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-center font-medium text-red-600 shadow-sm">
            {errorGlobal}
          </div>
        )}

        {!errorGlobal && eventosFiltrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">No se encontraron eventos</h3>
            <p className="text-slate-500">Prueba cambiando los filtros de búsqueda o estado.</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {eventosPaginados.map((evento) => (
                  <Card key={evento.id_evento} className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="border-b bg-slate-50 pb-3">
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="text-lg font-bold leading-tight text-slate-800">
                          <span className="mb-1 block text-xs text-slate-400">ID: {evento.id_evento}</span>
                          {evento.nombre}
                        </span>
                        <Badge className={getBadgeColor(evento.estado)}>{evento.estado}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-5 space-y-3 text-sm">
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="rounded bg-blue-100 p-1.5 text-blue-700">
                            <Calendar size={16} />
                          </div>
                          <span className="font-medium">
                            {new Date(evento.fecha_inicio).toLocaleDateString("es-ES")} <span className="mx-1 text-slate-400">al</span>{" "}
                            {new Date(evento.fecha_fin).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="rounded bg-amber-100 p-1.5 text-amber-700">
                            <MapPin size={16} />
                          </div>
                          <span className="font-medium">
                            {evento.ciudad} <span className="text-slate-400">·</span> {evento.lugar}
                          </span>
                        </div>
                        {evento.link_drive && (
                          <div className="flex items-start space-x-3 text-slate-600">
                            <div className="rounded bg-indigo-100 p-1.5 text-indigo-700">
                              <ExternalLink size={16} />
                            </div>
                            <a
                              href={evento.link_drive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all font-medium text-blue-600 underline"
                            >
                              Link Drive
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" className="w-full text-slate-700" onClick={() => handleOpenModal(evento)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100"
                            onClick={() => router.push(`/eventos/${evento.id_evento}/campanas`)}
                          >
                            <Megaphone className="mr-2 h-4 w-4" /> Campañas
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-slate-700" onClick={() => handleOpenArchivosModal(evento)}>
                            <FolderArchive className="mr-2 h-4 w-4" /> Archivos
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setEventoToDelete(evento);
                              setIsDeleteConfirmOpen(true);
                            }}
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

            {viewMode === "list" && (
              <div className="overflow-hidden rounded-md border bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                      <TableHead className="w-[80px] font-bold">ID</TableHead>
                      <TableHead className="font-bold">Nombre del Evento</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="font-bold">Fechas</TableHead>
                      <TableHead className="font-bold">Ubicación</TableHead>
                      <TableHead className="font-bold">Drive / Contactos</TableHead>
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
                        <TableCell className="text-sm text-slate-600">
                          <div className="space-y-1">
                            {evento.link_drive ? (
                              <a
                                href={evento.link_drive}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block break-all text-blue-600 underline"
                              >
                                Link Drive
                              </a>
                            ) : (
                              <span className="text-slate-400">Sin drive</span>
                            )}
                            <div className="text-xs text-slate-500">
                              {[evento.contacto_1_nombre, evento.contacto_2_nombre].filter(Boolean).join(" · ") || "Sin contactos"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" title="Editar Evento" onClick={() => handleOpenModal(evento)}>
                              <Edit className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              title="Ir a Campañas"
                              className="bg-blue-50 hover:bg-blue-100"
                              onClick={() => router.push(`/eventos/${evento.id_evento}/campanas`)}
                            >
                              <Megaphone className="h-4 w-4 text-blue-700" />
                            </Button>
                            <Button size="icon" variant="outline" title="Gestionar Archivos" onClick={() => handleOpenArchivosModal(evento)}>
                              <FolderArchive className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              title="Eliminar Evento"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => {
                                setEventoToDelete(evento);
                                setIsDeleteConfirmOpen(true);
                              }}
                              disabled
                            >
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

            <div className="mt-8 flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft size={20} className="mr-1" /> Anterior
              </Button>
              <span className="rounded-md border bg-white px-4 py-2 text-sm font-medium text-slate-600">
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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedEvento?.id_evento ? "Editar Evento" : "Crear Nuevo Evento"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleSaveEvento)} className="mt-2 space-y-4">
              {(errorModal || Object.keys(errors).length > 0) && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorModal && <p>{errorModal}</p>}
                  {errors.nombre && <p>• {errors.nombre.message}</p>}
                  {errors.fecha_inicio && <p>• {errors.fecha_inicio.message}</p>}
                  {errors.fecha_fin && <p>• {errors.fecha_fin.message}</p>}
                  {errors.ciudad && <p>• {errors.ciudad.message}</p>}
                  {errors.lugar && <p>• {errors.lugar.message}</p>}
                  {errors.link_drive && <p>• {errors.link_drive.message}</p>}
                  {errors.contacto_1_email && <p>• {errors.contacto_1_email.message}</p>}
                  {errors.contacto_2_email && <p>• {errors.contacto_2_email.message}</p>}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre del Evento</label>
                <Input {...register("nombre")} placeholder="Ej. Congreso Anual de Tecnología" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Fecha de Inicio</label>
                  <Input type="date" {...register("fecha_inicio")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Fecha de Fin</label>
                  <Input type="date" {...register("fecha_fin")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Ciudad</label>
                  <Input {...register("ciudad")} placeholder="Ej. Santiago" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Lugar / Recinto</label>
                  <Input {...register("lugar")} placeholder="Ej. Espacio Riesco" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Presupuesto MKT ($)</label>
                  <Input type="text" value={presupuesto} onChange={handlePresupuestoChange} placeholder="0" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Estado</label>
                  <Select
                    value={selectedEvento?.estado}
                    onValueChange={(value) => {
                      setSelectedEvento((prev) => (prev ? { ...prev, estado: value as EstadoEvento } : null));
                      setValue("estado", value as EstadoEvento, { shouldValidate: true, shouldDirty: true });
                    }}
                    disabled={!selectedEvento?.id_evento}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosEvento.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Link Drive</label>
                <Input {...register("link_drive")} placeholder="https://drive.google.com/..." />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 font-semibold text-slate-800">Contacto 1</h3>
                  <div className="space-y-3">
                    <Input {...register("contacto_1_nombre")} placeholder="Nombre contacto 1" />
                    <Input {...register("contacto_1_email")} placeholder="Correo contacto 1" />
                    <Input {...register("contacto_1_telefono")} placeholder="Teléfono contacto 1" />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 font-semibold text-slate-800">Contacto 2</h3>
                  <div className="space-y-3">
                    <Input {...register("contacto_2_nombre")} placeholder="Nombre contacto 2" />
                    <Input {...register("contacto_2_email")} placeholder="Correo contacto 2" />
                    <Input {...register("contacto_2_telefono")} placeholder="Teléfono contacto 2" />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Guardar Evento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <GestionArchivosDialog isOpen={isArchivosModalOpen} onClose={() => setIsArchivosModalOpen(false)} evento={eventoParaArchivos} />

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Eliminar Evento</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-slate-700">
              <p>¿Estás seguro de que deseas eliminar este evento y todo lo asociado a él?</p>
              <p className="mt-2 font-bold">{eventoToDelete?.nombre}</p>
              <p className="mt-2 text-sm italic text-red-500">Esta acción no se puede deshacer.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteEvento}>
                Sí, Eliminar Evento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
