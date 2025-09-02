"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Editor, Frame, Element } from "@craftjs/core";
import { AlertTriangle, ArrowLeft } from 'lucide-react';

// Importaciones de componentes de UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SingleValue } from 'react-select';
import { Select } from "@/components/ui/select";
import countryList from 'react-select-country-list';

import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import toast from 'react-hot-toast';

// Importaciones de Craft.js
import { LandingPagePresenter } from './LandingPagePresenter';
import { CampanaData, FormularioCampo, TicketData } from './types';
import { CraftContainer } from '@/components/craft/CraftContainer';
import { CraftText } from '@/components/craft/CraftText';
import { CraftImage } from "@/components/craft/CraftImage";
import { CraftVideo } from "@/components/craft/CraftVideo";
import { CraftButton } from "@/components/craft/CraftButton";
import { CraftSpacer } from "@/components/craft/CraftSpacer";
import { CraftColumns } from "@/components/craft/CraftColumns";

type FormDataShape = {
    [key: string]: string | string[] | FileList | null | undefined;
};

// --- Generar esquema de validación ---
const generarSchemaValidacion = (campos: FormularioCampo[]) => {
    const shape: { [key: string]: yup.AnySchema } = {};
    campos.forEach(campo => {
        if (!campo.es_visible) return;

        let validator: yup.AnySchema;
        switch (campo.tipo_campo) {
            case 'TEXTO_CORTO':
                if (campo.nombre_interno === 'email') {
                    validator = yup.string().email('Debe ser un email válido.');
                } else {
                    validator = yup.string();
                }
                break;
            case 'CASILLAS':
                let arrayValidator = yup.array().of(yup.string());
                if (campo.es_obligatorio) {
                    arrayValidator = arrayValidator.min(1, `Debes seleccionar al menos una opción para "${campo.etiqueta}".`).required(`El campo "${campo.etiqueta}" es obligatorio.`);
                }
                validator = arrayValidator;
                break;
            case 'ARCHIVO':
                validator = yup.mixed();
                if (campo.es_obligatorio) {
                    validator = validator.test('required', `El archivo para "${campo.etiqueta}" es obligatorio.`, (value: any): boolean => !!value && value.length > 0);
                }
                break;
            default:
                validator = yup.string();
        }

        if (campo.nombre_interno === 'email') {
            validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
        } else if (campo.es_obligatorio && !['CASILLAS', 'ARCHIVO'].includes(campo.tipo_campo)) {
            validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
        } else if (!campo.es_obligatorio) {
            validator = validator.nullable().transform((value: string | null) => (value === '' ? null : value));
        }

        shape[campo.nombre_interno] = validator;
    });
    return yup.object().shape(shape);
};

// --- Formulario dinámico ---
const FormularioDinamico = ({ formConfig, onSubmit, isSubmitting, defaultValues }: { formConfig: FormularioCampo[], onSubmit: (data: FormDataShape, reset: () => void) => void, isSubmitting: boolean, defaultValues?: Record<string, any> }) => {
    const validationSchema = generarSchemaValidacion(formConfig);
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormDataShape>({
        resolver: yupResolver(validationSchema),
        defaultValues: defaultValues || {}
    });

    const renderCampo = (campo: FormularioCampo) => {
        if (!campo.es_visible) return null;

        const fieldName = campo.nombre_interno;
        const error = errors[fieldName];
        const isEmailField = fieldName === 'email';
        const etiqueta = fieldName === 'nombre' ? 'Nombre Completo' : campo.etiqueta;

        // Campo 'país'
        if (fieldName === 'pais') {
            const options = countryList().getData();
            return (
                <div key={campo.id_campo}>
                    <Label htmlFor={fieldName}>{etiqueta}{campo.es_obligatorio ? '*' : ''}</Label>
                    <Controller
                        name={fieldName}
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un país..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((option: { value: string; label: string }) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
                </div>
            );
        }

        return (
            <div key={campo.id_campo}>
                <Label htmlFor={fieldName}>{etiqueta}{campo.es_obligatorio ? '*' : ''}</Label>

                {campo.tipo_campo === 'TEXTO_CORTO' && <Input id={fieldName} {...register(fieldName)} type={isEmailField ? 'email' : 'text'} readOnly={isEmailField && defaultValues?.[fieldName]} className={isEmailField && defaultValues?.[fieldName] ? 'bg-gray-100' : ''} />}
                {campo.tipo_campo === 'PARRAFO' && <Textarea id={fieldName} {...register(fieldName)} />}
                
                {campo.tipo_campo === 'DESPLEGABLE' && (
                    <Controller
                        name={fieldName}
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {campo.opciones?.map(opt => (
                                        <SelectItem
                                            key={opt.id_opcion || opt.etiqueta_opcion}
                                            value={opt.etiqueta_opcion}
                                        >
                                            {opt.etiqueta_opcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                )}

                {campo.tipo_campo === 'SELECCION_UNICA' && (
                    <Controller
                        name={fieldName}
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2 rounded-md border p-2 mt-1">
                                {campo.opciones?.map(opt => (
                                    <div key={opt.id_opcion} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id={`${fieldName}-${opt.id_opcion}`}
                                            {...field}
                                            value={opt.etiqueta_opcion}
                                            checked={field.value === opt.etiqueta_opcion}
                                            className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                        />
                                        <Label htmlFor={`${fieldName}-${opt.id_opcion}`}>{opt.etiqueta_opcion}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                )}
                {campo.tipo_campo === 'CASILLAS' && (
                    <Controller
                        name={fieldName}
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                            <div className="space-y-2 rounded-md border p-2 mt-1">
                                {campo.opciones?.map(opt => (
                                    <div key={opt.id_opcion} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`${fieldName}-${opt.id_opcion}`}
                                            checked={(field.value as string[])?.includes(opt.etiqueta_opcion)}
                                            onCheckedChange={(checked) => {
                                                const currentValues = (field.value as string[]) || [];
                                                if (checked) {
                                                    field.onChange([...currentValues, opt.etiqueta_opcion]);
                                                } else {
                                                    field.onChange(currentValues.filter((value: string) => value !== opt.etiqueta_opcion));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`${fieldName}-${opt.id_opcion}`}>{opt.etiqueta_opcion}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                )}
                {campo.tipo_campo === 'ARCHIVO' && <Input id={fieldName} {...register(fieldName)} type="file" />}
                {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data, reset))} className="space-y-4">
            {formConfig.map(renderCampo)}
            <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                {isSubmitting ? 'Procesando...' : 'Finalizar Inscripción'}
            </Button>
        </form>
    );
};

// --- Lista de tickets ---
const ListaTickets = ({ tickets, onSelectTicket }: { tickets: TicketData[], onSelectTicket: (ticket: TicketData) => void }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Elige tu entrada</h4>
            {tickets.length > 0 ? tickets.map(ticket => (
                <div key={ticket.id_tipo_entrada} className="p-3 border rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{ticket.nombre}</p>
                        <p className="text-sm font-bold">{formatCurrency(Number(ticket.precio))}</p>
                    </div>
                    <Button variant="outline" onClick={() => onSelectTicket(ticket)}>Seleccionar</Button>
                </div>
            )) : <p className="text-center text-gray-500">No hay tickets disponibles.</p>}
        </div>
    );
};

// --- Proceso de inscripción ---
const ProcesoInscripcion = ({ campana, tickets, formulario }: { campana: CampanaData['campana'], tickets: TicketData[], formulario: FormularioCampo[] }) => {
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [step, setStep] = useState<'selection' | 'email_check' | 'form'>('selection');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [prefilledData, setPrefilledData] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        if (!campana.obligatorio_pago) setStep('form');
    }, [campana.obligatorio_pago]);

    const handleSelectTicket = (ticket: TicketData) => {
        setSelectedTicket(ticket);
        setStep('email_check');
    };

    const handleBackToSelection = () => {
        setSelectedTicket(null);
        setPrefilledData(null);
        setEmail('');
        setStep('selection');
    };

    const handleCheckEmail = async () => {
        const emailSchema = yup.string().email('Email no válido').required('Email requerido');
        try {
            await emailSchema.validate(email);
        } catch (err: any) {
            toast.error(err.message);
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Verificando email...');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/verificar-contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, id_campana: campana.id_campana }),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || "Error al verificar el correo.");

            const { contacto, inscripcion } = result.data;
            if (inscripcion && inscripcion.estado_pago === 'Pagado') {
                throw new Error("Ya tienes una entrada válida para este evento.");
            }
            if (contacto) {
                setPrefilledData(contacto);
                toast.success("¡Hola de nuevo! Hemos rellenado tus datos.", { id: toastId });
            } else {
                setPrefilledData({ email });
                toast.success("Email verificado. Por favor, completa tus datos.", { id: toastId });
            }
            setStep('form');

        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitInscripcion = async (formData: FormDataShape, reset: () => void) => {
        setIsSubmitting(true);
        const toastId = toast.loading('Procesando inscripción...');

        const data = new FormData();
        data.append('id_campana', campana.id_campana.toString());
        if (selectedTicket) data.append('id_tipo_entrada', selectedTicket.id_tipo_entrada.toString());

        for (const key in formData) {
            if (Object.prototype.hasOwnProperty.call(formData, key)) {
                const value = formData[key];
                if (value instanceof FileList && value.length > 0) data.append(key, value[0]);
                else if (Array.isArray(value)) data.append(key, JSON.stringify(value));
                else if (value !== null && value !== undefined) data.append(key, String(value));
            }
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/inscripcion`, {
                method: 'POST',
                body: data,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Ocurrió un error al procesar tu inscripción.');

            if (result.success && result.redirectUrl) {
                toast.success("Redirigiendo a la pasarela de pago...", { id: toastId });
                window.location.href = result.redirectUrl;
            } else {
                toast.success("¡Inscripción exitosa! Revisa tu email.", { id: toastId, duration: 6000 });
                reset(); // <-- Limpiar campos
            }
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (campana.obligatorio_pago) {
        if (step === 'selection') return <ListaTickets tickets={tickets} onSelectTicket={handleSelectTicket} />;
        if (step === 'email_check') {
            return (
                <div className="space-y-4">
                    <Button variant="ghost" size="sm" onClick={handleBackToSelection} className="mb-2 -ml-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a seleccionar</Button>
                    <h4 className="font-semibold text-lg border-b pb-2">Paso 1: Ingresa tu email</h4>
                    <Label htmlFor="email-check">Correo Electrónico*</Label>
                    <Input id="email-check" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.correo@ejemplo.com" />
                    <Button onClick={handleCheckEmail} disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Verificando...' : 'Continuar'}
                    </Button>
                </div>
            );
        }
    }

    if (step === 'form') {
        return (
            <div>
                {campana.obligatorio_pago ? (
                    <Button variant="ghost" size="sm" onClick={handleBackToSelection} className="mb-4 -ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a seleccionar ticket
                    </Button>
                ) : null}
                <h4 className="font-semibold text-lg border-b pb-2 mb-4">Completa tus datos</h4>
                <FormularioDinamico
                    formConfig={formulario}
                    onSubmit={handleSubmitInscripcion}
                    isSubmitting={isSubmitting}
                    defaultValues={prefilledData || undefined}
                />
            </div>
        );
    }

    return null;
};

// --- Página de contenido ---
const PageContent = () => {
    const [slug, setSlug] = useState<string | null>(null);
    const [data, setData] = useState<CampanaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [landingJson, setLandingJson] = useState<string | undefined>(undefined);

    useEffect(() => {
        try {
            const pathParts = window.location.pathname.split('/').filter(part => part);
            const lastPart = pathParts.pop();
            if (lastPart) setSlug(lastPart);
            else throw new Error("No se pudo encontrar el identificador de la campaña en la URL.");
        } catch (e) {
            setError("No se pudo acceder a la URL para determinar la campaña.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (slug) {
            const fetchCampaignData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/campana/${slug}`);
                    const result = await response.json();
                    if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo cargar la información.');
                    setData(result.data);

                    const jsonString = result.data.campana.landing_page_json;
                    if (jsonString && jsonString !== "null") setLandingJson(jsonString);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchCampaignData();
        }
    }, [slug]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><p>Cargando campaña...</p></div>;
    if (error) return <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 text-red-700"><AlertTriangle className="h-16 w-16 mb-4" /><h1 className="text-2xl font-bold">Ocurrió un error</h1><p>{error}</p><Button onClick={() => window.location.href = '/'} className="mt-6">Volver al inicio</Button></div>;
    if (!data) return <div className="flex justify-center items-center min-h-screen"><p>No se encontró la campaña.</p></div>;

    return (
        <LandingPagePresenter data={data} form={<ProcesoInscripcion {...data} />}>
            <Frame json={landingJson}>
                <Element is={CraftContainer} canvas id="main-content" className="min-h-full" />
            </Frame>
        </LandingPagePresenter>
    );
}

export default function PublicCampaignPage() {
    return (
        <Editor enabled={false} resolver={{ CraftContainer, CraftText, CraftColumns, CraftImage, CraftVideo, CraftButton, CraftSpacer }}>
            <PageContent />
        </Editor>
    );
}
