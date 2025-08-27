    "use client";

    import { useState, useEffect } from 'react';
    import { useRouter } from 'next/navigation';
    import MainLayout from '@/components/Layout/MainLayout';    
    import { Button } from '@/components/ui/button';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
    import { toast } from 'react-hot-toast';
    import { BadgeCheck } from 'lucide-react';
    import { apiFetch } from '@/lib/api'; 

    interface Campana {
        id_campana: number;
        nombre: string;
        subevento_nombre: string;
    }

    interface Evento {
        id_evento: number;
        nombre: string;
        fecha_inicio: string;
        fecha_fin: string;
        campanas: Campana[];
    }

    export default function AcreditacionPage() {
        const router = useRouter();
        const [eventos, setEventos] = useState<Evento[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchEventosAcreditables = async () => {
                try {
                    const response = await apiFetch('/acreditacion/campanas');

                    if (!response.ok) {
                        throw new Error('No se pudo obtener la lista de eventos.');
                    }

                    const result = await response.json();
                    if (result.success) {
                        setEventos(result.data);
                    } else {
                        throw new Error(result.error || 'Error al cargar los datos.');
                    }
                } catch (error: any) {
                    toast.error(error.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchEventosAcreditables();
        }, []);

        const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

        if (loading) {
            return (
                <MainLayout title="Acreditación">
                    <div className="text-center p-10">Cargando eventos...</div>
                </MainLayout>
            );
        }
        
        return (
            <MainLayout title="Acreditación">
                <div className="p-4 md:p-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Acreditación</h1>
                        <p className="text-gray-500">Selecciona un evento y luego la campaña que deseas acreditar.</p>
                    </div>

                    {eventos.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {eventos.map((evento) => (
                                <AccordionItem value={`evento-${evento.id_evento}`} key={evento.id_evento} className="border rounded-lg bg-white shadow-sm">
                                    <AccordionTrigger className="p-6 text-xl font-semibold">
                                        {evento.nombre}
                                        <span className="text-sm font-normal text-gray-500 ml-4">{formatDate(evento.fecha_inicio)}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-6 pt-0">
                                        <div className="space-y-3">
                                            {evento.campanas.map((campana) => (
                                                <div key={campana.id_campana} className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                                                    <div>
                                                        <p className="font-medium">{campana.nombre}</p>
                                                        <p className="text-sm text-gray-600">{campana.subevento_nombre}</p>
                                                    </div>
                                                    <Button onClick={() => router.push(`/acreditacion/${campana.id_campana}`)}>
                                                        <BadgeCheck className="mr-2 h-4 w-4" />
                                                        Acreditar Campaña
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-10 border-dashed border-2 rounded-lg mt-4">
                            <p className="text-gray-500">No hay campañas activas para acreditar en este momento.</p>
                        </div>
                    )}
                </div>
            </MainLayout>
        );
    }