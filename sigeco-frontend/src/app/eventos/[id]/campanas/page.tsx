'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Ticket } from 'lucide-react';
import CrearSubCampañaDialog from '@/components/dialogs/CrearSubCampañaDialog';
// --- AÑADIDO: Importamos el layout principal ---
import MainLayout from '@/components/Layout/MainLayout';

// Definimos los tipos de datos que esperamos del backend
interface Campaña {
    id_campaña: number;
    id_evento: number;
    id_subevento: number | null;
    nombre: string;
    tipo_acceso: 'Gratuito' | 'De Pago';
    estado: 'Borrador' | 'Activa' | 'Pausada' | 'Finalizada';
}

// Tipo para los subeventos que cargaremos en el formulario
interface SubeventoSimple {
    id_subevento: number;
    nombre: string;
}

export default function GestionCampanasPage() {
    const [campañas, setCampañas] = useState<Campaña[]>([]);
    const [availableSubeventos, setAvailableSubeventos] = useState<SubeventoSimple[]>([]);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const id_evento = params.id as string;

    const fetchCampañas = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No estás autenticado.");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campanas/evento/${id_evento}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener las campañas.');

            const result = await response.json();
            if (result.success) {
                setCampañas(result.data);
            } else {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id_evento]);

    useEffect(() => {
        const fetchAvailableSubeventos = async () => {
            if (!id_evento) return;
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("No estás autenticado.");
                
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subeventos/evento/${id_evento}/sin-campana`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudieron cargar los subeventos disponibles.');

                const result = await response.json();
                if (result.success) {
                    setAvailableSubeventos(result.data);
                }
            } catch (err: any) {
                console.error("Error fetching available subevents:", err.message);
            }
        };

        fetchCampañas();
        fetchAvailableSubeventos();
    }, [id_evento, fetchCampañas]);

    const campañaPrincipal = campañas.find(c => c.id_subevento === null);
    const subCampañas = campañas.filter(c => c.id_subevento !== null);

    if (loading && campañas.length === 0) {
        // --- AÑADIDO: Mostramos el mensaje de carga dentro del layout ---
        return <MainLayout><p>Cargando campañas...</p></MainLayout>;
    }
    
    if (error) {
        // --- AÑADIDO: Mostramos el error dentro del layout ---
        return <MainLayout><p className="text-red-500">Error: {error}</p></MainLayout>;
    }

    return (
        // --- AÑADIDO: Envolvemos todo el contenido con MainLayout ---
        <MainLayout>
            <CrearSubCampañaDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                id_evento={parseInt(id_evento)}
                subeventosDisponibles={availableSubeventos}
                onSuccess={() => {
                    setCreateDialogOpen(false);
                    fetchCampañas();
                }}
            />

            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Gestión de Campañas</h1>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Sub-Campaña
                    </Button>
                </div>

                {campañaPrincipal && (
                    <Card className="mb-8 bg-slate-50">
                        <CardHeader>
                            <CardTitle className="text-2xl">{campañaPrincipal.nombre}</CardTitle>
                            <CardDescription>Esta es la campaña general que cubre todo el evento.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <div>
                                <Badge variant={campañaPrincipal.estado === 'Activa' ? 'default' : 'secondary'}>{campañaPrincipal.estado}</Badge>
                                <Badge variant="outline" className="ml-2">{campañaPrincipal.tipo_acceso}</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                                <Button size="sm"><Ticket className="mr-2 h-4 w-4" /> Gestionar Tickets</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <h2 className="text-2xl font-semibold mb-4">Campañas de Subeventos</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {subCampañas.map((campaña, i) => (
                        <Card key={`${campaña.id_campaña}-${i}`}>
                             <CardHeader>
                                <CardTitle>{campaña.nombre}</CardTitle>
                                <CardDescription>Campaña para subevento específico.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                   <Badge variant={campaña.estado === 'Activa' ? 'default' : 'secondary'}>{campaña.estado}</Badge>
                                   <Badge variant="outline">{campaña.tipo_acceso}</Badge>
                                </div>
                                 <div className="flex gap-2 mt-auto">
                                    <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/> Editar</Button>
                                    <Button size="sm"><Ticket className="mr-2 h-4 w-4"/> Gestionar Tickets</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {subCampañas.length === 0 && <p>No hay campañas para subeventos todavía.</p>}
                </div>
            </div>
        </MainLayout>
    );
}
