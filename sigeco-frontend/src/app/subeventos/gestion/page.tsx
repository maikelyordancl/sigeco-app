"use client";

import { useState, useEffect } from "react";
import { useForm, FieldErrors, FieldError } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";
import { Plus, Calendar, MapPin, Link, Globe, Mail, Phone, Users, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Evento {
  id_evento: number;
  nombre: string;
}

interface Subevento {
  id_subevento?: number;
  id_evento: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  ciudad?: string | null;
  lugar?: string | null;
  link_adicional?: string | null;
  texto_libre?: string | null;
  nombre_evento_mailing?: string | null;
  fecha_hora_mailing?: string | null;
  asunto_mailing?: string | null;
  remitente_mailing?: string | null;
  ruta_texto_mailing?: string | null;
  ruta_imagen_mailing?: string | null;
  ruta_formulario?: string | null;
  sitio_web?: string | null;
  contacto_1_nombre?: string | null;
  contacto_1_email?: string | null;
  contacto_1_telefono?: string | null;
  contacto_2_nombre?: string | null;
  contacto_2_email?: string | null;
  contacto_2_telefono?: string | null;
  obligatorio_registro: boolean;
  obligatorio_pago: boolean;
}

const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const nullableUrlField = Yup.string()
  .nullable()
  .transform((value) => (value === "" ? null : value))
  .test("nullable-url", "Debe ser una URL válida o estar vacío.", (value) => !value || Yup.string().url().isValidSync(value));

const nullableEmailField = Yup.string()
  .nullable()
  .transform((value) => (value === "" ? null : value))
  .email("Debe ser un correo válido o estar vacío.");

const validationSchema = Yup.object().shape({
  id_evento: Yup.number().required("El evento asociado es obligatorio.").typeError("Debe seleccionar un evento válido."),
  nombre: Yup.string().required("El nombre del subevento es obligatorio."),
  fecha_inicio: Yup.string().required("La fecha de inicio es obligatoria."),
  fecha_fin: Yup.string()
    .required("La fecha de finalización es obligatoria.")
    .test("is-after", "La fecha de finalización debe ser posterior a la fecha de inicio.", function (value) {
      const { fecha_inicio } = this.parent;
      return new Date(value) > new Date(fecha_inicio);
    }),
  ciudad: Yup.string().nullable().optional(),
  lugar: Yup.string().nullable().optional(),
  link_adicional: nullableUrlField,
  texto_libre: Yup.string().nullable().optional(),
  nombre_evento_mailing: Yup.string().nullable().optional(),
  fecha_hora_mailing: Yup.string().nullable().optional(),
  asunto_mailing: Yup.string().nullable().optional(),
  remitente_mailing: Yup.string().nullable().optional(),
  ruta_texto_mailing: Yup.string().nullable().optional(),
  ruta_imagen_mailing: Yup.string().nullable().optional(),
  ruta_formulario: Yup.string().nullable().optional(),
  sitio_web: nullableUrlField,
  contacto_1_nombre: Yup.string().nullable().optional(),
  contacto_1_email: nullableEmailField,
  contacto_1_telefono: Yup.string().nullable().optional(),
  contacto_2_nombre: Yup.string().nullable().optional(),
  contacto_2_email: nullableEmailField,
  contacto_2_telefono: Yup.string().nullable().optional(),
  obligatorio_registro: Yup.boolean()
    .required("Este campo es obligatorio.")
    .oneOf([true, false], "Debe seleccionar una opción válida."),
  obligatorio_pago: Yup.boolean()
    .required("Este campo es obligatorio.")
    .oneOf([true, false], "Debe seleccionar una opción válida.")
    .test(
      "registro-requerido",
      "Si el subevento requiere pago, también debe requerir registro.",
      function (value) {
        return !value || this.parent.obligatorio_registro;
      }
    ),
});

const emptyToNull = (value?: string | null) => {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed ? trimmed : null;
};

function ContactCard({
  title,
  nombre,
  email,
  telefono,
}: {
  title: string;
  nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
}) {
  if (!nombre && !email && !telefono) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
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
}

export default function GestionSubeventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEventoId, setSelectedEventoId] = useState<number | undefined>(undefined);
  const [subeventos, setSubeventos] = useState<Subevento[]>([]);
  const [selectedSubevento, setSelectedSubevento] = useState<Subevento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [subeventoToDelete, setSubeventoToDelete] = useState<Subevento | null>(null);

  const { register, handleSubmit, reset } = useForm<Subevento>({
    resolver: yupResolver(validationSchema),
    defaultValues: selectedSubevento || {
      nombre: "",
      fecha_inicio: "",
      fecha_fin: "",
      ciudad: "",
      lugar: "",
      link_adicional: "",
      texto_libre: "",
      nombre_evento_mailing: "",
      fecha_hora_mailing: "",
      asunto_mailing: "",
      remitente_mailing: "",
      ruta_texto_mailing: "",
      ruta_imagen_mailing: "",
      ruta_formulario: "",
      sitio_web: "",
      contacto_1_nombre: "",
      contacto_1_email: "",
      contacto_1_telefono: "",
      contacto_2_nombre: "",
      contacto_2_email: "",
      contacto_2_telefono: "",
      obligatorio_registro: false,
      obligatorio_pago: false,
    },
  });

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await apiFetch(`/eventos`, {});
        const data = await response.json();

        if (response.ok && data.success) {
          setEventos(data.data);
        } else {
          setErrorGlobal(data.error || "Error al obtener los eventos.");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        setErrorGlobal("Error de red al obtener eventos. " + errorMessage);
        console.error("❌ Error al obtener eventos:", errorMessage);
      }
    };

    fetchEventos().catch((error) => {
      console.error("❌ Error al obtener eventos:", error);
    });
  }, []);

  useEffect(() => {
    if (selectedEventoId) {
      const fetchSubeventos = async () => {
        try {
          const response = await apiFetch(`/subeventos?id_evento=${selectedEventoId}`);

          if (!response.ok) {
            setErrorGlobal(`Error HTTP: ${response.status}`);
            return;
          }

          const data = await response.json();

          if (data.success) {
            setSubeventos(data.data);
          } else {
            setErrorGlobal(data.error || "Error al obtener los subeventos.");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido";
          setErrorGlobal("Error al obtener subeventos: " + errorMessage);
          console.error("❌ Error al obtener subeventos:", errorMessage);
        }
      };

      fetchSubeventos();
    }
  }, [selectedEventoId]);

  const handleOpenModal = (subevento?: Subevento) => {
    setSelectedSubevento(subevento || null);
    setIsModalOpen(true);

    reset({
      id_subevento: subevento?.id_subevento ?? undefined,
      id_evento: selectedEventoId,
      nombre: subevento?.nombre ?? "",
      fecha_inicio: formatDateForInput(subevento?.fecha_inicio),
      fecha_fin: formatDateForInput(subevento?.fecha_fin),
      ciudad: subevento?.ciudad ?? "",
      lugar: subevento?.lugar ?? "",
      link_adicional: subevento?.link_adicional ?? "",
      texto_libre: subevento?.texto_libre ?? "",
      nombre_evento_mailing: subevento?.nombre_evento_mailing ?? "",
      fecha_hora_mailing: subevento?.fecha_hora_mailing ?? "",
      asunto_mailing: subevento?.asunto_mailing ?? "",
      remitente_mailing: subevento?.remitente_mailing ?? "",
      ruta_texto_mailing: subevento?.ruta_texto_mailing ?? "",
      ruta_imagen_mailing: subevento?.ruta_imagen_mailing ?? "",
      ruta_formulario: subevento?.ruta_formulario ?? "",
      sitio_web: subevento?.sitio_web ?? "",
      contacto_1_nombre: subevento?.contacto_1_nombre ?? "",
      contacto_1_email: subevento?.contacto_1_email ?? "",
      contacto_1_telefono: subevento?.contacto_1_telefono ?? "",
      contacto_2_nombre: subevento?.contacto_2_nombre ?? "",
      contacto_2_email: subevento?.contacto_2_email ?? "",
      contacto_2_telefono: subevento?.contacto_2_telefono ?? "",
      obligatorio_registro: subevento?.obligatorio_registro ?? false,
      obligatorio_pago: subevento?.obligatorio_pago ?? false,
    });
  };

  const handleSaveSubevento = async (data: Subevento) => {
    if (!selectedEventoId) {
      toast.error("Debes seleccionar un evento.");
      return;
    }

    const isEditing = Boolean(data.id_subevento);
    const url = isEditing ? `/subeventos/${data.id_subevento}` : `/subeventos`;
    const method = isEditing ? "PUT" : "POST";
    const payload = {
      ...data,
      id_evento: selectedEventoId,
      link_adicional: emptyToNull(data.link_adicional),
      texto_libre: emptyToNull(data.texto_libre),
      nombre_evento_mailing: emptyToNull(data.nombre_evento_mailing),
      fecha_hora_mailing: emptyToNull(data.fecha_hora_mailing),
      asunto_mailing: emptyToNull(data.asunto_mailing),
      remitente_mailing: emptyToNull(data.remitente_mailing),
      ruta_texto_mailing: emptyToNull(data.ruta_texto_mailing),
      ruta_imagen_mailing: emptyToNull(data.ruta_imagen_mailing),
      ruta_formulario: emptyToNull(data.ruta_formulario),
      sitio_web: emptyToNull(data.sitio_web),
      contacto_1_nombre: emptyToNull(data.contacto_1_nombre),
      contacto_1_email: emptyToNull(data.contacto_1_email),
      contacto_1_telefono: emptyToNull(data.contacto_1_telefono),
      contacto_2_nombre: emptyToNull(data.contacto_2_nombre),
      contacto_2_email: emptyToNull(data.contacto_2_email),
      contacto_2_telefono: emptyToNull(data.contacto_2_telefono),
    };

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(isEditing ? "Subevento actualizado con éxito." : "Subevento creado con éxito.");
        setIsModalOpen(false);

        const fetchResponse = await apiFetch(`/subeventos?id_evento=${selectedEventoId}`);
        const newData = await fetchResponse.json();
        if (newData.success) {
          setSubeventos(newData.data);
        }
      } else if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach((err: any) => {
          toast.error(err.msg, { duration: 3000 });
        });
      } else {
        toast.error(result.error || "Ocurrió un error al guardar el subevento.");
      }
    } catch (error) {
      console.error("❌ Error de red:", error);
      toast.error("Error de red al intentar guardar el subevento.");
    }
  };

  const handleDeleteSubevento = async () => {
    if (!subeventoToDelete) return;

    try {
      const response = await apiFetch(`/subeventos/${subeventoToDelete.id_subevento}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Subevento eliminado con éxito.");
        setSubeventos(subeventos.filter((s) => s.id_subevento !== subeventoToDelete.id_subevento));
        setIsDeleteConfirmOpen(false);
        setSubeventoToDelete(null);
      } else {
        toast.error(result.error || "Error al eliminar el subevento.");
      }
    } catch (error) {
      toast.error("Error de red al intentar eliminar el subevento. " + error);
    }
  };

  const handleFormErrors = (errors: FieldErrors<Subevento>) => {
    Object.values(errors).forEach((error) => {
      const fieldError = error as FieldError;
      if (fieldError?.message) {
        toast.error(fieldError.message, { duration: 1500 });
      }
    });
  };

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Gestión de Subeventos</h1>

        <Select onValueChange={(value) => setSelectedEventoId(Number(value))}>
          <SelectTrigger className="mb-4 w-full">
            <SelectValue placeholder="Selecciona un evento" />
          </SelectTrigger>
          <SelectContent>
            {eventos.map((evento) => (
              <SelectItem key={evento.id_evento} value={evento.id_evento.toString()}>
                {evento.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEventoId && (
          <>
            <Button onClick={() => handleOpenModal()} className="mb-4">
              <Plus size={20} /> Crear Subevento
            </Button>

            {errorGlobal && <div className="mb-4 text-red-500">{errorGlobal}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subeventos.map((subevento) => (
                <Card key={subevento.id_subevento} className="shadow-md">
                  <CardHeader>
                    <CardTitle>00{subevento.id_subevento} - {subevento.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>
                        {new Date(subevento.fecha_inicio).toLocaleDateString("es-ES")} - {new Date(subevento.fecha_fin).toLocaleDateString("es-ES")}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center space-x-2">
                      <MapPin size={16} />
                      <span>
                        {subevento.ciudad || "-"} - {subevento.lugar || "-"}
                      </span>
                    </div>

                    <div className="min-h-6 space-y-2">
                      {subevento.sitio_web && (
                        <div className="flex items-center space-x-2">
                          <Globe size={16} />
                          <a
                            href={subevento.sitio_web}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-blue-500 underline"
                          >
                            Página Web
                          </a>
                        </div>
                      )}

                      {subevento.link_adicional && (
                        <div className="flex items-center space-x-2">
                          <Link size={16} />
                          <a
                            href={subevento.link_adicional}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-blue-500 underline"
                          >
                            Link Adicional
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-between">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(subevento)}>
                        Ver / Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSubeventoToDelete(subevento);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedSubevento ? "Editar Subevento" : "Crear Subevento"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleSaveSubevento, handleFormErrors)} className="space-y-4">
              <Input {...register("nombre")} placeholder="Nombre del Subevento" />

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" {...register("fecha_inicio")} />
                <Input type="date" {...register("fecha_fin")} />
              </div>

              <Input {...register("ciudad")} placeholder="Ciudad" />
              <Input {...register("lugar")} placeholder="Lugar" />
              <Input {...register("link_adicional")} placeholder="Link adicional (URL)" />
              <Input {...register("sitio_web")} placeholder="Sitio web (URL)" />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Texto libre</label>
                <Textarea {...register("texto_libre")} placeholder="Escribe aquí el texto libre visible del subevento" rows={5} />
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

              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("obligatorio_registro")}
                    id="obligatorio_registro"
                    className="h-4 w-4 rounded border-gray-300 focus:ring focus:ring-primary"
                  />
                  <label htmlFor="obligatorio_registro" className="text-sm font-medium">
                    ¿Registro obligatorio?
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("obligatorio_pago")}
                    id="obligatorio_pago"
                    className="h-4 w-4 rounded border-gray-300 focus:ring focus:ring-primary"
                  />
                  <label htmlFor="obligatorio_pago" className="text-sm font-medium">
                    ¿Pago obligatorio?
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro de que deseas eliminar este subevento?</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteSubevento}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
