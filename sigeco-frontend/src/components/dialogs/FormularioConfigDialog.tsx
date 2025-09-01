"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LandingPageEditor } from "../craft/LandingPageEditor"; 
import { toast } from "react-hot-toast";
import { PlusCircle, Trash2, GripVertical, Pencil } from 'lucide-react'; 
import { apiFetch } from "@/lib/api";

// Tipos de datos
interface FormularioCampo {
    id_campo: number;
    nombre_interno: string;
    etiqueta: string;
    tipo_campo: 'TEXTO_CORTO' | 'PARRAFO' | 'SELECCION_UNICA' | 'CASILLAS' | 'DESPLEGABLE' | 'ARCHIVO';
    es_de_sistema: boolean;
    es_fijo: boolean;
    es_visible: boolean;
    es_obligatorio: boolean;
    orden: number;
    opciones?: { id_opcion?: number; etiqueta_opcion: string }[];
}

interface FormularioConfigDialogProps {
    isOpen: boolean;
    onClose: () => void;
    id_campana: number | null;
}

const AddOrEditFieldDialog = ({ open, onOpenChange, onSave, existingField }: any) => {
    const isEditing = !!existingField;
    const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm({
        defaultValues: {
            etiqueta: '',
            tipo_campo: '',
            es_obligatorio: false,
            opciones: ''
        }
    });

    useEffect(() => {
        if (open) {
            if (isEditing) {
                reset({
                    etiqueta: existingField.etiqueta,
                    tipo_campo: existingField.tipo_campo,
                    es_obligatorio: existingField.es_obligatorio,
                    opciones: (existingField.opciones || []).map((opt: any) => opt.etiqueta_opcion).join('\n')
                });
            } else {
                reset({
                    etiqueta: '',
                    tipo_campo: undefined,
                    es_obligatorio: false,
                    opciones: ''
                });
            }
        }
    }, [open, isEditing, existingField, reset]);

    const tipoCampo = watch('tipo_campo');

    const onSubmit = (data: any) => {
        const fieldData = {
            etiqueta: data.etiqueta,
            tipo_campo: data.tipo_campo,
            es_obligatorio: data.es_obligatorio,
            opciones: data.opciones ? data.opciones.split('\n').map((opt: string) => ({ etiqueta_opcion: opt.trim() })).filter((opt: any) => opt.etiqueta_opcion) : []
        };
        onSave(fieldData, isEditing ? existingField.id_campo : null);
    };

    const handleClose = () => {
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Campo' : 'Añadir Nuevo Campo'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label>Tipo de Campo</Label>
                        <Controller
                            name="tipo_campo"
                            control={control}
                            rules={{ required: "Debe seleccionar un tipo" }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                                    <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEXTO_CORTO">Texto Corto</SelectItem>
                                        <SelectItem value="PARRAFO">Párrafo</SelectItem>
                                        <SelectItem value="SELECCION_UNICA">Selección Única</SelectItem>
                                        <SelectItem value="CASILLAS">Casillas de Verificación</SelectItem>
                                        <SelectItem value="DESPLEGABLE">Menú Desplegable</SelectItem>
                                        <SelectItem value="ARCHIVO">Subir Archivo</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.tipo_campo && <p className="text-red-500 text-xs mt-1">{(errors.tipo_campo as any).message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="etiqueta">Etiqueta / Pregunta</Label>
                        <Input id="etiqueta" {...register('etiqueta', { required: "La etiqueta es obligatoria" })} />
                         {errors.etiqueta && <p className="text-red-500 text-xs mt-1">{(errors.etiqueta as any).message}</p>}
                    </div>
                    {['SELECCION_UNICA', 'CASILLAS', 'DESPLEGABLE'].includes(tipoCampo) && (
                        <div>
                            <Label htmlFor="opciones">Opciones (una por línea)</Label>
                            <Textarea id="opciones" {...register('opciones')} />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <Controller name="es_obligatorio" control={control} render={({ field }) => <Checkbox id="es_obligatorio" checked={field.value} onCheckedChange={field.onChange} />} />
                        <Label htmlFor="es_obligatorio">Este campo es requerido</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                        <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Añadir Campo'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export const FormularioConfigDialog = ({ isOpen, onClose, id_campana }: FormularioConfigDialogProps) => {
    const { control, handleSubmit, reset, watch } = useForm<{ campos: FormularioCampo[] }>({
        defaultValues: { campos: [] }
    });
    const { fields, append, remove, update } = useFieldArray({ control, name: "campos" });

    const [loading, setLoading] = useState(false);
    const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState<FormularioCampo | null>(null);

    const fetchFormConfig = useCallback(async () => {
        if (!id_campana) return;
        setLoading(true);
        try {
            const res = await apiFetch(`/campanas/${id_campana}/formulario`, {
            });
            if (!res.ok) throw new Error("No se pudo cargar la configuración del formulario.");
            const result = await res.json();
            if (result.success) {
                const camposConBooleanos = result.data.map((campo: FormularioCampo) => ({
                    ...campo,
                    es_obligatorio: !!campo.es_obligatorio,
                    es_visible: !!campo.es_visible,
                }));
                reset({ campos: camposConBooleanos });
            } else throw new Error(result.error);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id_campana, reset]);

    useEffect(() => {
        if (isOpen) fetchFormConfig();
    }, [isOpen, fetchFormConfig]);
    
    // Guardar la configuración general (visibilidad, obligatoriedad)
    const onSaveConfig = async (data: { campos: FormularioCampo[] }) => {
        const toastId = toast.loading("Guardando configuración...");
        try {
            await apiFetch(`/campanas/${id_campana}/formulario`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campos: data.campos }),
            });
            toast.success("Formulario guardado con éxito.", { id: toastId });
            onClose();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };
    
    // --- 4. LÓGICA UNIFICADA PARA CREAR Y ACTUALIZAR CAMPOS ---
    const handleSaveField = async (data: any, fieldId: number | null) => {
        const isEditing = fieldId !== null;
        const toastId = toast.loading(isEditing ? "Actualizando campo..." : "Añadiendo campo...");
        
        const url = isEditing
            ? `/campanas/formulario/campos/${fieldId}`
            : `/campanas/formulario/campos`;
        
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "No se pudo guardar el campo.");

            if (isEditing) {
                const fieldIndex = fields.findIndex(f => f.id_campo === fieldId);
                if (fieldIndex > -1) {
                    const updatedField = { ...fields[fieldIndex], ...result.data, es_obligatorio: data.es_obligatorio };
                    update(fieldIndex, updatedField);
                }
            } else {
                append({
                    ...result.data,
                    es_visible: true,
                    es_obligatorio: data.es_obligatorio,
                    orden: fields.length,
                });
            }
            
            toast.success(isEditing ? "Campo actualizado" : "Campo añadido", { id: toastId });
            setIsFieldDialogOpen(false);
            setFieldToEdit(null);

        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };
    
    // Eliminar un campo
    const handleDeleteField = async (fieldIndex: number) => {
        const fieldToDelete = watch(`campos.${fieldIndex}`);
        if (fieldToDelete.es_de_sistema) return;
        
        const toastId = toast.loading("Eliminando campo...");
        try {
            await apiFetch(`/campanas/formulario/campos/${fieldToDelete.id_campo}`, {
                method: 'DELETE',
            });
            remove(fieldIndex);
            toast.success("Campo eliminado", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const camposSistema = fields.filter(f => f.es_de_sistema);
    const camposPersonalizados = fields.map((f, i) => ({ ...f, originalIndex: i })).filter(f => !f.es_de_sistema);
    
    // --- 5. FUNCIONES PARA ABRIR LOS DIÁLOGOS ---
    const openAddFieldDialog = () => {
        setFieldToEdit(null);
        setIsFieldDialogOpen(true);
    };

    const openEditFieldDialog = (field: FormularioCampo, index: number) => {
        // Buscamos el campo completo con sus opciones para pasarlo al diálogo
        const fullField = fields.find(f => f.id_campo === field.id_campo);
        setFieldToEdit({ ...fullField!, es_obligatorio: watch(`campos.${index}.es_obligatorio`) });
        setIsFieldDialogOpen(true);
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Configuración de Formulario</DialogTitle>
                    <DialogDescription>Personaliza los campos de inscripción para esta campaña.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="formulario">
                    <TabsList>
                        <TabsTrigger value="formulario">Formulario</TabsTrigger>
                    </TabsList>
                    <TabsContent value="formulario" className="mt-4">
                        <form onSubmit={handleSubmit(onSaveConfig)}>
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                                {camposSistema.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Campos del Sistema</h3>
                                        <div className="space-y-3">
                                            {fields.map((field, index) => (
                                                field.es_de_sistema ? (
                                                <div key={field.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                                                    <Label htmlFor={`campos.${index}.es_visible`}>{field.etiqueta}</Label>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Controller name={`campos.${index}.es_obligatorio`} control={control} render={({ field: controllerField }) => (<Checkbox id={`campos.${index}.es_obligatorio`} disabled={field.es_fijo || !watch(`campos.${index}.es_visible`)} checked={controllerField.value} onCheckedChange={controllerField.onChange} />)} />
                                                            <Label htmlFor={`campos.${index}.es_obligatorio`}>Requerido</Label>
                                                        </div>
                                                        <Controller name={`campos.${index}.es_visible`} control={control} render={({ field: controllerField }) => (<Switch id={`campos.${index}.es_visible`} disabled={field.es_fijo} checked={controllerField.value} onCheckedChange={controllerField.onChange} />)} />
                                                    </div>
                                                </div>
                                                ) : null
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold mb-2">Campos Personalizados</h3>
                                    <div className="space-y-3">
                                        {camposPersonalizados.map((field) => (
                                            <div key={field.id_campo} className="flex items-center space-x-2 p-3 border rounded-md">
                                                <GripVertical className="cursor-move text-gray-400" />
                                                <div className="flex-grow">
                                                    <p className="font-medium">{field.etiqueta}</p>
                                                    <p className="text-xs text-gray-500">{field.tipo_campo}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Controller name={`campos.${field.originalIndex}.es_obligatorio`} control={control} render={({ field: controllerField }) => (<Checkbox id={`campos.${field.originalIndex}.es_obligatorio`} checked={controllerField.value} onCheckedChange={controllerField.onChange} />)} />
                                                    <Label htmlFor={`campos.${field.originalIndex}.es_obligatorio`}>Requerido</Label>
                                                </div>
                                                {/* --- 6. BOTONES DE EDITAR Y ELIMINAR --- */}
                                                <Button type="button" variant="ghost" size="icon" onClick={() => openEditFieldDialog(field, field.originalIndex)}>
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteField(field.originalIndex)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" className="w-full" onClick={openAddFieldDialog}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Campo
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                                <Button type="submit">Guardar Configuración</Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>

                {/* --- 7. USAR EL NUEVO DIÁLOGO UNIFICADO --- */}
                <AddOrEditFieldDialog 
                    open={isFieldDialogOpen} 
                    onOpenChange={setIsFieldDialogOpen} 
                    onSave={handleSaveField}
                    existingField={fieldToEdit}
                />
            </DialogContent>
        </Dialog>
    );
};