"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Asistente } from './types';
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import Select from "react-select";
import countryList from "react-select-country-list";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    asistente: Asistente;
    campanaInfo: any;
    onUpdate: (updatedAsistente: Asistente) => void;
    id_campana: string;
};

export function AsistenteDetalleSheet({ isOpen, onClose, asistente, campanaInfo, onUpdate, id_campana }: Props) {
    const [formulario, setFormulario] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [nota, setNota] = useState(asistente.nota || '');
    const [estadoAsistencia, setEstadoAsistencia] = useState(asistente.estado_asistencia);

    useEffect(() => {
        if (!isOpen || !id_campana) return;

        const fetchFormulario = async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`/campanas/${id_campana}/formulario`);
                if (!res.ok) throw new Error("Error al obtener formulario");
                const data = await res.json();
                setFormulario(data.data);

                const initialValues: Record<string, any> = {};
                data.data.forEach((field: any) => {
                    const valueFromBackend = asistente[field.nombre_interno];
                    if (field.tipo_campo === 'CASILLAS' && typeof valueFromBackend === 'string') {
                        try {
                            // Intenta parsear como JSON.
                            initialValues[field.nombre_interno] = JSON.parse(valueFromBackend);
                        } catch (e) {
                            // Si falla, asume que es una cadena separada por comas (para datos antiguos).
                            initialValues[field.nombre_interno] = valueFromBackend.split(',').map((s: string) => s.trim());
                        }
                    } else {
                        initialValues[field.nombre_interno] = valueFromBackend || "";
                    }
                });
                setFormValues(initialValues);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFormulario();
    }, [isOpen, id_campana, asistente]);

    const handleChange = (fieldName: string, value: any) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    };

    const handleCheckboxChange = (fieldName: string, optionValue: string, checked: boolean) => {
        const currentValues = formValues[fieldName] || [];
        let newValues;
        if (checked) {
            newValues = [...currentValues, optionValue];
        } else {
            newValues = currentValues.filter((val: string) => val !== optionValue);
        }
        handleChange(fieldName, newValues);
    };

    const handleSave = async () => {
        try {
            const baseFields = ['nombre', 'email', 'telefono', 'rut', 'empresa', 'actividad', 'profesion', 'pais', 'comuna'];
            const datosContacto: Record<string, any> = {};
            const respuestas: { id_campo: number; valor: any }[] = [];

            if (formulario) {
                formulario.forEach((field: any) => {
                    let value = formValues[field.nombre_interno];

                    if (Array.isArray(value)) {
                        value = value.join(', ');
                    }

                    if (field.es_de_sistema && baseFields.includes(field.nombre_interno)) {
                        datosContacto[field.nombre_interno] = value;
                    } else {
                        respuestas.push({ id_campo: field.id_campo, valor: value === '' ? null : value });
                    }
                });
            }

            const payload = {
                estado_asistencia: estadoAsistencia,
                nota: nota,
                respuestas,
                ...datosContacto
            };

            const res = await apiFetch(`/campanas/asistentes/${asistente.id_inscripcion}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al actualizar asistente');
            }
            toast.success('Asistente actualizado correctamente');

            const updatedAsistente: Asistente = { ...asistente };
            Object.keys(formValues).forEach(key => {
                updatedAsistente[key] = formValues[key];
            });
            Object.assign(updatedAsistente, datosContacto, {
                estado_asistencia: estadoAsistencia,
                nota: nota,
            });

            onUpdate(updatedAsistente);
        } catch (err: any) {
            console.error(err);
            toast.error(`Error al guardar cambios: ${err.message}`);
        }
    };

    const renderField = (field: any) => {
        const value = formValues[field.nombre_interno] || '';

        switch (field.tipo_campo) {
            case 'PARRAFO':
                return <Textarea value={value} onChange={(e) => handleChange(field.nombre_interno, e.target.value)} className="border p-2 rounded" />;

            case 'SELECCION_UNICA':
            case 'DESPLEGABLE':
                return (
                    <select value={value} onChange={(e) => handleChange(field.nombre_interno, e.target.value)} className="border p-2 rounded w-full">
                        <option value="">-- Seleccione --</option>
                        {field.opciones?.map((opt: any) => (
                            <option key={opt.id_opcion} value={opt.etiqueta_opcion}>
                                {opt.etiqueta_opcion}
                            </option>
                        ))}
                    </select>
                );

            case 'CASILLAS':
                return (
                    <div className="space-y-2">
                        {field.opciones?.map((opt: any) => (
                            <div key={opt.id_opcion} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${field.nombre_interno}-${opt.id_opcion}`}
                                    checked={(value || []).includes(opt.etiqueta_opcion)}
                                    onCheckedChange={(checked) => handleCheckboxChange(field.nombre_interno, opt.etiqueta_opcion, !!checked)}
                                />
                                <Label htmlFor={`${field.nombre_interno}-${opt.id_opcion}`}>{opt.etiqueta_opcion}</Label>
                            </div>
                        ))}
                    </div>
                );

            case 'ARCHIVO':
                return value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        Ver Archivo <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                ) : <span className="text-gray-500">No hay archivo adjunto.</span>;

            case 'TEXTO_CORTO':
            default:
                // --- Campo especial: pais ---
                if (field.nombre_interno === 'pais') {
                    const options = countryList().getData(); // [{ value, label }]
                    const selected = options.find(opt => opt.value === value) || null;
                    return (
                        <Select
                            value={selected}
                            options={options}
                            onChange={(selectedOption) => handleChange(field.nombre_interno, selectedOption?.value)}
                        />
                    );
                }
                return <Input type="text" value={value} onChange={(e) => handleChange(field.nombre_interno, e.target.value)} className="border p-2 rounded" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Asistente: {asistente.nombre}</DialogTitle>
                </DialogHeader>

                {loading ? <p>Cargando formulario...</p> : (
                    <div className="space-y-4 py-4">
                        {formulario?.map((field: any) => (
                            <div key={field.nombre_interno} className="flex flex-col">
                                <Label className="text-sm font-medium mb-2">{field.etiqueta}</Label>
                                {renderField(field)}
                            </div>
                        ))}

                        <hr className="my-6 border-gray-300" />

                        <div className="flex flex-col">
                            <Label className="text-sm font-medium mb-2">Estado de Asistencia</Label>
                            <select value={estadoAsistencia} onChange={(e) => setEstadoAsistencia(e.target.value)} className="border p-2 rounded w-full">
                                <option value="Invitado">Invitado</option>
                                <option value="Registrado">Registrado</option>
                                <option value="Confirmado">Confirmado</option>
                                <option value="Por Confirmar">Por Confirmar</option>
                                <option value="No Asiste">No Asiste</option>
                                <option value="Asistió">Asistió</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <Label className="text-sm font-medium mb-2">Notas</Label>
                            <Textarea
                                value={nota}
                                onChange={(e) => setNota(e.target.value)}
                                className="border p-2 rounded resize-y"
                                rows={4}
                                placeholder="Escribe notas adicionales aquí..."
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
