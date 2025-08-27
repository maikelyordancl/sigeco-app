"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PagoDetails {
    monto: number;
    estado: 'Pendiente' | 'Pagado' | 'Fallido' | 'Anulado'; // Tipado estricto
    orden_compra: string;
    fecha_actualizado: string;
    contacto_nombre: string;
    email: string;
    ticket_nombre: string;
}

function ConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [details, setDetails] = useState<PagoDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError("No se proporcionó un token de transacción.");
            setLoading(false);
            return;
        }

        const fetchPaymentDetails = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/pago/${token}`);
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "No se pudieron obtener los detalles del pago.");
                }

                // --- INICIO DE LA LÓGICA DE REDIRECCIÓN ---
                if (result.data.estado !== 'Pagado') {
                    // Si el pago no está confirmado, redirigimos a la página de fallo
                    router.replace(`/pago/fracaso?token=${token}`);
                    return; // Detenemos la ejecución para no intentar mostrar la página de éxito
                }
                // --- FIN DE LA LÓGICA DE REDIRECCIÓN ---

                setDetails(result.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [token, router]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('es-ES');

    if (loading) {
        return <Loader className="mx-auto h-16 w-16 animate-spin text-gray-400" />;
    }

    if (error) {
        // ... (código de manejo de error sin cambios)
    }

    if (!details) {
        return null; // No mostrar nada mientras se redirige
    }

    // El resto del componente que muestra los detalles del pago exitoso
    return (
        <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <CardTitle className="mt-4 text-2xl font-bold">¡Pago Confirmado!</CardTitle>
            <CardDescription>Gracias por tu compra, {details.contacto_nombre}.</CardDescription>
            <CardContent className="mt-6 text-left space-y-2">
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Estado:</span>
                    <span className="font-semibold text-green-600">{details.estado}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Entrada:</span>
                    <span className="font-semibold">{details.ticket_nombre}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Monto Pagado:</span>
                    <span className="font-semibold">{formatCurrency(details.monto)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Orden de Compra:</span>
                    <span className="font-semibold text-xs">{details.orden_compra}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Fecha:</span>
                    <span className="font-semibold">{formatDate(details.fecha_actualizado)}</span>
                </div>
            </CardContent>
            <Button onClick={() => router.push('/')} className="mt-4">Volver al Inicio</Button>
        </>
    );
}

export default function PagoConfirmadoPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-12 w-12"/></div>}>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Card className="w-full max-w-md text-center shadow-lg p-6">
                    <ConfirmationContent />
                </Card>
            </div>
        </Suspense>
    );
}