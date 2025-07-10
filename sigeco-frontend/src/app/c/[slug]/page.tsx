"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Calendar, MapPin, Ticket, AlertTriangle, UserPlus, Minus, Plus, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

// Tipos de datos
interface TicketData {
    id_tipo_entrada: number;
    nombre: string;
    precio: number;
    cantidad_total: number | null;
    cantidad_vendida: number;
}

interface CampanaData {
    campana: {
        id_campana: number;
        id_subevento: number | null;
        nombre: string;
        evento_nombre: string;
        subevento_nombre: string | null;
        fecha_inicio: string;
        fecha_fin: string;
        ciudad: string;
        lugar: string;
        tipo_acceso: 'De Pago' | 'Gratuito';
        obligatorio_pago: boolean;
        obligatorio_registro: boolean;
    };
    tickets: TicketData[];
}

// Esquema de validación unificado
const unifiedRegistroSchema = yup.object().shape({
    nombre: yup.string().required('Tu nombre es requerido.'),
    apellido: yup.string().required('Tu apellido es requerido.'),
    email: yup.string().email('Debe ser un email válido.').required('Tu email es requerido.'),
    telefono: yup.string().required('Tu teléfono es requerido.'),
    rut: yup.string().required('Tu RUT es requerido.'),
    pais: yup.string().required('Tu país es requerido.'),
    empresa: yup.string().nullable(),
    actividad: yup.string().nullable(),
});
type UnifiedFormData = yup.InferType<typeof unifiedRegistroSchema>;

// --- INICIO DE LA CORRECCIÓN ---

// Componente de Formulario Unificado
const FormularioUnificado = ({ campana }: { campana: CampanaData['campana'] }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<UnifiedFormData>({ 
        resolver: yupResolver(unifiedRegistroSchema) 
    });

    // Se restaura la lógica completa del onSubmit, incluyendo el fetch al backend.
    const onSubmit = async (data: UnifiedFormData) => {
        const toastId = toast.loading('Enviando inscripción...');
        try {
            const payload = {
                ...data,
                id_campana: campana.id_campana, // Añadimos el ID de la campaña
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/inscripcion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            const result = await response.json();

            if (!response.ok) {
                if (result.errors && Array.isArray(result.errors)) {
                    const errorMessage = result.errors.map((e: any) => e.msg).join('. ');
                    throw new Error(errorMessage);
                }
                throw new Error(result.message || 'Ocurrió un error al inscribirte.');
            }

            toast.success(`¡Gracias por inscribirte, ${data.nombre}! Revisa tu email para más detalles.`, { id: toastId, duration: 6000 });
            reset(); // Limpia el formulario
            
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-sm text-gray-600">Completa tus datos para participar en el evento.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label htmlFor="nombre">Nombre*</Label><Input id="nombre" {...register('nombre')} />{errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}</div>
                <div><Label htmlFor="apellido">Apellido*</Label><Input id="apellido" {...register('apellido')} />{errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>}</div>
            </div>
            <div><Label htmlFor="email">Email*</Label><Input id="email" type="email" {...register('email')} />{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label htmlFor="telefono">Teléfono*</Label><Input id="telefono" {...register('telefono')} />{errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}</div>
                <div><Label htmlFor="rut">RUT / Identificación*</Label><Input id="rut" {...register('rut')} />{errors.rut && <p className="text-red-500 text-xs mt-1">{errors.rut.message}</p>}</div>
            </div>
            <div><Label htmlFor="pais">País*</Label><Input id="pais" {...register('pais')} />{errors.pais && <p className="text-red-500 text-xs mt-1">{errors.pais.message}</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label htmlFor="empresa">Empresa</Label><Input id="empresa" {...register('empresa')} /></div>
                <div><Label htmlFor="actividad">Actividad</Label><Input id="actividad" {...register('actividad')} /></div>
            </div>
            <Button type="submit" className="w-full !mt-5" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Finalizar Inscripción'}
            </Button>
        </form>
    );
};
// --- FIN DE LA CORRECCIÓN ---


// Componente para la lista de tickets de pago
const ListaTickets = ({ tickets }: { tickets: TicketData[] }) => {
    const [cantidades, setCantidades] = useState<Record<number, number>>({});
    const handleCantidadChange = (ticketId: number, delta: number) => setCantidades(prev => ({ ...prev, [ticketId]: Math.max(0, (prev[ticketId] || 0) + delta) }));
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
    const total = Object.entries(cantidades).reduce((acc, [ticketId, cantidad]) => {
        const ticket = tickets.find(t => t.id_tipo_entrada === Number(ticketId));
        return acc + (ticket ? Number(ticket.precio) * cantidad : 0);
    }, 0);

    return (
        <div className="space-y-4">
            {tickets.length > 0 ? tickets.map(ticket => (
                <div key={ticket.id_tipo_entrada} className="p-3 border rounded-md flex justify-between items-center">
                    <div><p className="font-semibold">{ticket.nombre}</p><p className="text-sm font-bold">{formatCurrency(Number(ticket.precio))}</p></div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCantidadChange(ticket.id_tipo_entrada, -1)}><Minus className="h-4 w-4" /></Button>
                        <span className="font-bold w-4 text-center">{cantidades[ticket.id_tipo_entrada] || 0}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCantidadChange(ticket.id_tipo_entrada, 1)}><Plus className="h-4 w-4" /></Button>
                    </div>
                </div>
            )) : <p className="text-center text-gray-500">No hay tickets disponibles para la venta en este momento.</p>}
            {total > 0 && (
                <div className="pt-4 border-t"><div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCurrency(total)}</span></div><Button className="w-full mt-4">Proceder al Pago</Button></div>
            )}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function PublicCampaignPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [data, setData] = useState<CampanaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchCampaignData();
        }
    }, [slug]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    if (loading) return <div className="flex justify-center items-center min-h-screen"><p>Cargando campaña...</p></div>;
    if (error) return <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 text-red-700"><AlertTriangle className="h-16 w-16 mb-4" /><h1 className="text-2xl font-bold">Ocurrió un error</h1><p>{error}</p><Button onClick={() => window.location.href = '/'} className="mt-6">Volver al inicio</Button></div>;
    if (!data) return null;

    const { campana, tickets } = data;
    const isSubCampaign = !!campana.id_subevento;

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white shadow-sm"><div className="container mx-auto py-6 px-4"><h1 className="text-3xl font-bold text-gray-800">{campana.evento_nombre}</h1><p className="text-lg text-gray-600">{campana.subevento_nombre || 'Evento Principal'}</p></div></header>
            <main className={`container mx-auto py-8 px-4 grid grid-cols-1 ${isSubCampaign ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-8`}>
                <div className={isSubCampaign ? 'md:col-span-2' : 'md:col-span-1'}>
                    <Card><CardHeader><CardTitle className="text-2xl">{campana.nombre}</CardTitle><CardDescription className="flex items-center pt-2"><Badge variant={campana.tipo_acceso === 'De Pago' ? 'destructive' : 'default'}>{campana.tipo_acceso}</Badge></CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center text-gray-700"><Calendar className="h-5 w-5 mr-3 text-gray-500" /><span>{formatDate(campana.fecha_inicio)} - {formatDate(campana.fecha_fin)}</span></div><div className="flex items-center text-gray-700"><MapPin className="h-5 w-5 mr-3 text-gray-500" /><span>{campana.ciudad}, {campana.lugar}</span></div></div></CardContent></Card>
                </div>

                {isSubCampaign && (
                    <aside className="md:col-span-1">
                        <Card className="sticky top-8">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    {campana.obligatorio_pago ? <Ticket className="h-6 w-6 mr-3" /> : <UserPlus className="h-6 w-6 mr-3" />}
                                    {campana.obligatorio_pago ? 'Elige tus Entradas' : 'Inscríbete Aquí'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {campana.obligatorio_pago ? (
                                    <ListaTickets tickets={tickets} />
                                ) : (
                                    <FormularioUnificado campana={campana} />
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                )}
                
                {!isSubCampaign && (
                    <div className="mt-8"><Card className="bg-blue-50 border-blue-200"><CardHeader className="flex flex-row items-center gap-3"><Info className="h-6 w-6 text-blue-600"/><CardTitle className="text-blue-800">Página Informativa del Evento</CardTitle></CardHeader><CardContent className="text-blue-700"><p>Esta es la página principal del evento. Las inscripciones y venta de entradas se realizan en las páginas de cada actividad o sub-evento específico.</p></CardContent></Card></div>
                )}
            </main>
        </div>
    );
}
