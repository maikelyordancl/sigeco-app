"use client";

import { useState, useEffect } from "react";
import { useForm, FieldErrors, FieldError } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";
import { Plus, Calendar, MapPin, Link } from "lucide-react";
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
    obligatorio_registro: boolean;
    obligatorio_pago: boolean;
}

const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    // Asegurarse de que la fecha se interpreta correctamente antes de formatear
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Devolver vacío si la fecha no es válida
    return date.toISOString().split('T')[0];
};

const validationSchema = Yup.object().shape({
    id_evento: Yup.number()
        .required("El evento asociado es obligatorio.")
        .typeError("Debe seleccionar un evento válido."),
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
    // --- CORRECCIÓN ---
    // Se permite una cadena vacía o una URL válida.
    link_adicional: Yup.string().nullable().url("Debe ser una URL válida o estar vacío.").transform(value => value === '' ? null : value),
    texto_libre: Yup.string().nullable().optional(),
    nombre_evento_mailing: Yup.string().nullable().optional(),
    fecha_hora_mailing: Yup.string().nullable().optional(),
    asunto_mailing: Yup.string().nullable().optional(),
    remitente_mailing: Yup.string().nullable().optional(),
    ruta_texto_mailing: Yup.string().nullable().optional(),
    ruta_imagen_mailing: Yup.string().nullable().optional(),
    ruta_formulario: Yup.string().nullable().optional(),
    sitio_web: Yup.string().nullable().url("Debe ser una URL válida o estar vacío.").transform(value => value === '' ? null : value),
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
            obligatorio_registro: false,
            obligatorio_pago: false
        },
    });

    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await apiFetch(`/eventos`, {
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    setEventos(data.data);
                } else {
                    setErrorGlobal(data.error || "Error al obtener los eventos.");
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                setErrorGlobal("Error de red al obtener eventos. " + errorMessage);
                console.error("❌ Error al obtener eventos:", errorMessage); // Maneja el error sin lanzarlo
            }
        };

        fetchEventos().catch(error => {
            console.error("❌ Error al obtener eventos:", error);
            // Aquí puedes manejar el error globalmente si lo deseas
        });
    }, []);

    useEffect(() => {
    if (selectedEventoId) {
        const fetchSubeventos = async () => {
            // const token = localStorage.getItem("token"); // Ya no necesitas esto aquí
            try {
                // 👇 2. Reemplaza fetch con apiFetch
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
            obligatorio_registro: subevento?.obligatorio_registro ?? false,
            obligatorio_pago: subevento?.obligatorio_pago ?? false,
        });
    };

    const handleSaveSubevento = async (data: Subevento) => {
        console.log("Enviando datos del formulario:", data);

        if (!selectedEventoId) {
            toast.error("Debes seleccionar un evento.");
            return;
        }

        const isEditing = Boolean(data.id_subevento);
        const url = isEditing
            ? `/subeventos/${data.id_subevento}`
            : `/subeventos`;

        const method = isEditing ? "PUT" : "POST";
        const payload = { ...data, id_evento: selectedEventoId };

        try {
            const response = await apiFetch(url, {
                method: method,
                body: JSON.stringify(payload),
            });

            
            const result = await response.json();
            console.log("📥 Respuesta del servidor:", result);

            if (response.ok && result.success) {
                toast.success(isEditing ? "Subevento actualizado con éxito." : "Subevento creado con éxito.");
                setIsModalOpen(false);

                // Una forma más simple y segura de refrescar la lista
                const fetchResponse = await apiFetch(`/subeventos?id_evento=${selectedEventoId}`);
                const newData = await fetchResponse.json();
                if (newData.success) {
                    setSubeventos(newData.data);
                }

            } else {
                // --- MANEJO DE ERRORES MEJORADO ---
                if (result.errors && Array.isArray(result.errors)) {
                    // Si el backend envió un array de errores de validación, muéstralos.
                    result.errors.forEach((err: any) => {
                        toast.error(err.msg, { duration: 3000 }); // Muestra un toast por cada error específico
                    });
                } else {
                    // Si es otro tipo de error del servidor.
                    toast.error(result.error || "Ocurrió un error al guardar el subevento.");
                }
                // --- FIN DEL MANEJO DE ERRORES ---
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
                method: "DELETE"
            });
            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("Subevento eliminado con éxito.");
                setSubeventos(subeventos.filter(s => s.id_subevento !== subeventoToDelete.id_subevento));
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
        console.error("❌ Errores del formulario:", errors);

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
                <h1 className="text-3xl font-bold mb-6">Gestión de Subeventos</h1>

                <Select onValueChange={value => setSelectedEventoId(Number(value))}>
                    <SelectTrigger className="w-full mb-4">
                        <SelectValue placeholder="Selecciona un evento" />
                    </SelectTrigger>
                    <SelectContent>
                        {eventos.map(evento => (
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

                        {errorGlobal && <div className="text-red-500 mb-4">{errorGlobal}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subeventos.map(subevento => (
                                <Card key={subevento.id_subevento} className="shadow-md">
                                    <CardHeader>
                                        <CardTitle>00{subevento.id_subevento} - {subevento.nombre}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Calendar size={16} />
                                            <span>
                                                {new Date(subevento.fecha_inicio).toLocaleDateString("es-ES")} - {new Date(subevento.fecha_fin).toLocaleDateString("es-ES")}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <MapPin size={16} />
                                            <span>{subevento.ciudad || "-"} - {subevento.lugar || "-"}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 min-h-6">
                                            {subevento.link_adicional && (
                                                <>
                                                    <Link size={16} />
                                                    <a href={subevento.link_adicional} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                                        Link Adicional
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                        <div className="mt-4 flex justify-between">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenModal(subevento)}>
                                                Ver / Editar
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => { setSubeventoToDelete(subevento); setIsDeleteConfirmOpen(true); }}>
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
                    <DialogContent>
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
                            <Input {...register("link_adicional")} placeholder="Link Adicional (URL)" />
                            <Input {...register("sitio_web")} placeholder="Sitio Web (URL)" />

                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        {...register("obligatorio_registro")}
                                        id="obligatorio_registro"
                                        className="w-4 h-4 rounded border-gray-300 focus:ring focus:ring-primary"
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
                                        className="w-4 h-4 rounded border-gray-300 focus:ring focus:ring-primary"
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
                            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
                            <Button variant="destructive" onClick={handleDeleteSubevento}>Eliminar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}