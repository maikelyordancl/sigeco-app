"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

import AcreditacionTable from './components/AcreditacionTable';
import { ConfigureColumnsAcreditacion } from './components/ConfigureColumnsAcreditacion';
import { Asistente, CampoFormulario } from './types';
import { RegistrarEnPuertaDialog } from './components/RegistrarEnPuertaDialog';
import { FormularioCampo as FormularioCampoPublico } from '@/app/c/[slug]/types';
import MainLayout from '@/components/Layout/MainLayout';

export default function AcreditarCampanaPage() {
    const router = useRouter();
    const params = useParams();
    const id_campana = params.id_campana as string;

    const [asistentes, setAsistentes] = useState<Asistente[]>([]);
    const [campos, setCampos] = useState<CampoFormulario[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['nombre', 'email']);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [campanaInfo, setCampanaInfo] = useState<any>(null);
    const [formFieldsModal, setFormFieldsModal] = useState<FormularioCampoPublico[]>([]);
    const [updatingId, setUpdatingId] = useState<number | null>(null); // fila en actualización

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const asistentesResponse = await apiFetch(`/campanas/${id_campana}/asistentes-v2`);
            if (!asistentesResponse.ok) throw new Error('No se pudo cargar la lista de asistentes.');
            const asistentesResult = await asistentesResponse.json();
            setAsistentes(asistentesResult);

            const formResponse = await apiFetch(`/campanas/${id_campana}/formulario`);
            const formResult = await formResponse.json();
            if (formResult.success) {
                setCampos(formResult.data);
            } else {
                 throw new Error('No se pudo cargar la configuración de columnas.');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id_campana]);

    useEffect(() => {
        if (id_campana) {
            const fetchModalData = async () => {
                try {
                    const campanaResponse = await apiFetch(`/campanas/${id_campana}`);
                    const campanaResult = await campanaResponse.json();
                    if(campanaResult.success) setCampanaInfo(campanaResult.data);
                    
                    const formModalResponse = await apiFetch(`/campanas/${id_campana}/formulario`);
                    const formModalResult = await formModalResponse.json();
                    if(formModalResult.success) setFormFieldsModal(formModalResult.data);
                } catch (error) {
                    console.error("No se pudo cargar la configuración para el registro en puerta.");
                }
            };
            fetchModalData();
        }
    }, [id_campana]);
    
    useEffect(() => {
        if (id_campana) {
            fetchPageData();
        }
    }, [id_campana, fetchPageData]);
    
    const filteredAsistentes = useMemo(() => {
        if (!searchTerm) return asistentes;
        return asistentes.filter(asistente =>
            Object.values(asistente).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [asistentes, searchTerm]);

    const stats = useMemo(() => {
        const total = asistentes.length;
        const acreditados = asistentes.filter(a => a.estado_asistencia === 'Asistió').length;
        const pendientes = total - acreditados;
        return { total, acreditados, pendientes };
    }, [asistentes]);
    
    const handleUpdateStatus = async (id_inscripcion: number, nuevo_estado: 'Asistió' | 'Cancelado' | 'Confirmado') => {
        if (updatingId !== null) return;
        setUpdatingId(id_inscripcion);

        const toastId = toast.loading('Actualizando...');
        try {
            const response = await apiFetch(`/acreditacion/inscripcion/${id_inscripcion}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ nuevo_estado }),
            });

            if (!response.ok) throw new Error('No se pudo actualizar el estado.');
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            setAsistentes(prev =>
                prev.map(a =>
                    a.id_inscripcion === id_inscripcion
                        ? { ...a, estado_asistencia: nuevo_estado }
                        : a
                )
            );

            toast.success('Asistente actualizado', { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setUpdatingId(null);
        }
    };
    
    const handleSuccessRegistration = () => {
        setIsModalOpen(false);
        fetchPageData(); 
    };
    
    return (
        <MainLayout>
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => router.push('/eventos')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
                    </Button>
                    <h1 className="text-2xl font-bold text-center">{campanaInfo ? campanaInfo.nombre : 'Acreditación'}</h1>
                    <div className="w-28"></div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Panel de Control</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col lg:flex-row gap-4">
                        {/* Contadores */}
                        <div className="grid grid-cols-3 gap-4 flex-1">
                            <div className="p-4 border rounded-lg text-center">
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <div className="p-4 border rounded-lg text-center">
                                <p className="text-sm text-gray-500">Acreditados</p>
                                <p className="text-2xl font-bold text-green-600">{stats.acreditados}</p>
                            </div>
                            <div className="p-4 border rounded-lg text-center">
                                <p className="text-sm text-gray-500">Pendientes</p>
                                <p className="text-2xl font-bold text-gray-600">{stats.pendientes}</p>
                            </div>
                        </div>

                        {/* Buscador y botones */}
                        <div className="flex flex-col flex-1 gap-2">
                            <Input
                                placeholder="Buscar asistente (nombre, email, rut...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div className="flex gap-2">
                                <ConfigureColumnsAcreditacion
                                    campos={campos}
                                    visibleColumns={visibleColumns}
                                    setVisibleColumns={setVisibleColumns}
                                />
                                {campanaInfo && !campanaInfo.obligatorio_pago && (
                                    <Button
                                        onClick={() => setIsModalOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" /> Registrar en Puerta
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="relative">
                    {loading ? (
                        <div className="text-center py-10">Cargando asistentes...</div>
                    ) : (
                        <>
                            <AcreditacionTable 
                                asistentes={filteredAsistentes}
                                campos={campos}
                                visibleColumns={visibleColumns}
                                onUpdateStatus={handleUpdateStatus}
                                updatingId={updatingId} 
                            />
                            {updatingId !== null && (
                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xl font-bold">
                                    Actualizando...
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {campanaInfo && !campanaInfo.obligatorio_pago && (
                <RegistrarEnPuertaDialog
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccessRegistration}
                    id_campana={Number(id_campana)}
                    formFields={formFieldsModal}
                />
            )}
        </MainLayout>
    );
}
