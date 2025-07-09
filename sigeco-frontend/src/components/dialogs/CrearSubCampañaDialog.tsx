import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface SubeventoSimple {
    id_subevento: number;
    nombre: string;
}

interface CrearSubCampañaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    id_evento: number;
    subeventosDisponibles: SubeventoSimple[];
    onSuccess: () => void;
}

export default function CrearSubCampañaDialog({
    isOpen, onClose, id_evento, subeventosDisponibles, onSuccess
}: CrearSubCampañaDialogProps) {
    const [nombreCampaña, setNombreCampaña] = useState('');
    const [selectedSubevento, setSelectedSubevento] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!selectedSubevento) {
            setError('Debes seleccionar un subevento.');
            return;
        }
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campanas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nombre: nombreCampaña,
                    id_evento: id_evento,
                    id_subevento: parseInt(selectedSubevento),
                    tipo_acceso: 'De Pago' // Por defecto
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al crear la campaña.');
            }
            
            onSuccess();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Campaña de Subevento</DialogTitle>
                        <DialogDescription>
                            Asigna una campaña a un subevento que aún no tenga una.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subevento" className="text-right">Subevento</Label>
                            <Select
                                onValueChange={setSelectedSubevento}
                                value={selectedSubevento}
                                disabled={subeventosDisponibles.length === 0}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un subevento" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subeventosDisponibles.map(sub => (
                                        <SelectItem key={sub.id_subevento} value={String(sub.id_subevento)}>
                                            {sub.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nombre" className="text-right">Nombre</Label>
                            <Input
                                id="nombre"
                                value={nombreCampaña}
                                onChange={(e) => setNombreCampaña(e.target.value)}
                                className="col-span-3"
                                placeholder="Ej: Campaña de Lanzamiento"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creando...' : 'Crear Campaña'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}