"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import { ArrowLeft, UserCheck, UserX, RotateCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Asistente {
    id_inscripcion: number;
    estado_asistencia: 'Invitado' | 'Registrado' | 'Confirmado' | 'Asistió' | 'Cancelado';
    nombre: string;
    rut: string;
    email: string;
    tipo_entrada: string | null;
}

export default function AcreditarCampanaPage() {
    const router = useRouter();
    const params = useParams();
    const id_campana = params.id_campana as string;

    const [asistentes, setAsistentes] = useState<Asistente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchAsistentes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch(`/acreditacion/campana/${id_campana}/asistentes_acreditacion`, {
            });
            if (!response.ok) throw new Error('No se pudo cargar la lista de asistentes.');
            const result = await response.json();
            if (result.success) {
                setAsistentes(result.data);
            } else {
                throw new Error(result.error || 'Error al cargar los datos.');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id_campana]);

    useEffect(() => {
        if (id_campana) {
            fetchAsistentes();
        }
    }, [id_campana, fetchAsistentes]);
    
    const filteredAsistentes = useMemo(() => {
        if (!searchTerm) return asistentes;
        return asistentes.filter(a => 
            a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.rut && a.rut.toLowerCase().includes(searchTerm.toLowerCase())) ||
            a.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [asistentes, searchTerm]);

    const stats = useMemo(() => {
        const total = asistentes.length;
        const acreditados = asistentes.filter(a => a.estado_asistencia === 'Asistió').length;
        const pendientes = total - acreditados;
        return { total, acreditados, pendientes };
    }, [asistentes]);
    
    const handleUpdateStatus = async (id_inscripcion: number, nuevo_estado: 'Asistió' | 'Cancelado' | 'Confirmado') => {
        const originalState = [...asistentes];
        setAsistentes(prev => prev.map(a => a.id_inscripcion === id_inscripcion ? { ...a, estado_asistencia: nuevo_estado } : a));

        try {
            const token = localStorage.getItem('token');
            const response = await apiFetch(`/acreditacion/inscripcion/${id_inscripcion}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ nuevo_estado }),
            });

            if (!response.ok) throw new Error('No se pudo actualizar el estado.');
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            toast.success(`Asistente actualizado a: ${nuevo_estado}`);

        } catch (error: any) {
            // Revert on error
            setAsistentes(originalState);
            toast.error(error.message);
        }
    };
    
    const getStatusBadge = (estado: Asistente['estado_asistencia']) => {
        switch (estado) {
            case 'Asistió': return <Badge className="bg-green-500">Acreditado</Badge>;
            case 'Cancelado': return <Badge variant="destructive">Denegado</Badge>;
            default: return <Badge variant="secondary">Pendiente</Badge>;
        }
    };
    
    return (
        <MainLayout title="Acreditar Campaña">
            <div className="p-4 md:p-6">
                <div className="flex items-center mb-4">
                    <Button variant="outline" onClick={() => router.push('/acreditacion')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la selección
                    </Button>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Panel de Acreditación</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input 
                            placeholder="Buscar por nombre, RUT, email..."
                            className="lg:col-span-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="p-4 border rounded-lg text-center">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                            <p className="text-sm text-gray-500">Acreditados</p>
                            <p className="text-2xl font-bold text-green-600">{stats.acreditados}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="border rounded-lg overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>RUT</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Entrada</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center h-24">Cargando...</TableCell></TableRow>
                            ) : filteredAsistentes.map((asistente, index) => (
                                <TableRow key={asistente.id_inscripcion}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{asistente.nombre} </TableCell>
                                    <TableCell>{asistente.rut || 'No especificado'}</TableCell>
                                    <TableCell>{asistente.email}</TableCell>
                                    <TableCell>{asistente.tipo_entrada || 'General'}</TableCell>
                                    <TableCell className="text-center">{getStatusBadge(asistente.estado_asistencia)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {asistente.estado_asistencia !== 'Asistió' ? (
                                            <>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(asistente.id_inscripcion, 'Asistió')}>
                                                    <UserCheck className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(asistente.id_inscripcion, 'Cancelado')}>
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(asistente.id_inscripcion, 'Confirmado')}>
                                                <RotateCcw className="h-4 w-4" /> Revertir
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </MainLayout>
    );
}