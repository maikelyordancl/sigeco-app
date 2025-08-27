"use client";

import { XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation'; // <-- Importar el router

export default function PagoFracasoPage() {
    const router = useRouter(); // <-- Inicializar el router

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <XCircle className="mx-auto h-16 w-16 text-red-500" />
                    <CardTitle className="mt-4 text-2xl font-bold">Pago Fallido</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-6">
                        Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.
                    </p>
                    {/* Usar router.back() para volver atrás */}
                    <Button onClick={() => router.back()}>Volver a Intentar</Button>
                </CardContent>
            </Card>
        </div>
    );
}