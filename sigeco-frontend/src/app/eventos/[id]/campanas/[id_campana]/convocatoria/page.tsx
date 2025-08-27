"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send } from "lucide-react";
import { Label } from "@/components/ui/label"; 
import MainLayout from "@/components/Layout/MainLayout";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";

// Tipos de datos
interface BaseDatos {
  id_base: number;
  nombre: string;
  cantidad_contactos: number;
}

interface Campana {
    id_campana: number;
    nombre: string;
    subevento_nombre?: string;
}

const ConvocatoriaPage = () => {
  const router = useRouter();
  const params = useParams();
  const id_evento = params.id as string;
  const id_campana = params.id_campana as string;

  const [campana, setCampana] = useState<Campana | null>(null);
  const [basesDeDatos, setBasesDeDatos] = useState<BaseDatos[]>([]);
  const [selectedBases, setSelectedBases] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch de los datos de la campaña y las bases de datos
  const fetchData = useCallback(async () => {
    if (!id_campana) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
        // Obtener detalles de la campaña
        const campanaRes = await apiFetch(`/campanas/${id_campana}`, {
        });
        const campanaData = await campanaRes.json();
        if(!campanaData.success) throw new Error("No se pudo cargar la campaña.");
        setCampana(campanaData.data);

        // Obtener bases de datos
        const basesRes = await apiFetch(`/basedatos`, {
        });
        const basesData = await basesRes.json();
        if(!basesData.success) throw new Error("No se pudieron cargar las bases de datos.");
        setBasesDeDatos(basesData.data);

    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  }, [id_campana]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectBase = (id_base: number) => {
    setSelectedBases(prev => 
        prev.includes(id_base) 
            ? prev.filter(id => id !== id_base) 
            : [...prev, id_base]
    );
  };

  const handleConvocar = async () => {
    if (selectedBases.length === 0) {
        toast.error("Debes seleccionar al menos una base de datos.");
        return;
    }
    const toastId = toast.loading("Enviando invitaciones...");
    try {
        const token = localStorage.getItem("token");
        // Este endpoint lo crearemos en el siguiente paso
        const response = await apiFetch(`/campanas/${id_campana}/convocar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bases_origen: selectedBases })
        });

        const result = await response.json();
        if(!response.ok) throw new Error(result.error || "Error en la convocatoria.");

        toast.success(result.message, { id: toastId, duration: 4000 });
        setSelectedBases([]);

    } catch (error: any) {
        toast.error(error.message, { id: toastId });
    }
  };


  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => router.push(`/eventos/${id_evento}/campanas`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Campañas
          </Button>
        </div>

        {loading ? <p>Cargando...</p> : (
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Convocar Asistentes</CardTitle>
                    <CardDescription>
                        Campaña: <strong>{campana?.nombre}</strong> ({campana?.subevento_nombre || 'Evento Principal'})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <h4 className="font-semibold">Selecciona las bases de datos a invitar:</h4>
                        <div className="max-h-80 overflow-y-auto border rounded-md p-4 space-y-2">
                            {basesDeDatos.map(base => (
                                <div key={base.id_base} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                    <Checkbox 
                                        id={`base-${base.id_base}`}
                                        checked={selectedBases.includes(base.id_base)}
                                        onCheckedChange={() => handleSelectBase(base.id_base)}
                                    />
                                    <Label htmlFor={`base-${base.id_base}`} className="flex-grow cursor-pointer">
                                        {base.nombre} 
                                        <span className="text-xs text-gray-500 ml-2">({base.cantidad_contactos} contactos)</span>
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full" onClick={handleConvocar} disabled={selectedBases.length === 0}>
                            <Send className="mr-2 h-4 w-4" /> Convocar Bases Seleccionadas
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ConvocatoriaPage;