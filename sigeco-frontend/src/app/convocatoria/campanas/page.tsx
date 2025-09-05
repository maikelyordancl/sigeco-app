// sigeco-frontend/src/app/convocatoria/campanas/page.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Importar Link para navegación interna
import { apiFetch } from '@/lib/api';
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Importar CardFooter
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Importar nuevos íconos
import { Calendar, Megaphone, ExternalLink, Settings } from 'lucide-react';

interface Evento {
  id_evento: number;
  nombre: string;
}

interface Campana {
  id_campana: number;
  id_evento: number; // Añadido para construir la URL de gestión
  nombre: string;
  estado: string;
  subevento_nombre?: string | null;
  fecha_creado: string;
  fecha_modificado: string;
  url_amigable?: string | null;
  fecha_personalizada?: string;
}

const CampanasPorEventoPage = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<string>('');
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEventos = useCallback(async () => {
    try {
      const response = await apiFetch('/eventos');
      if (response.ok) {
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setEventos(data.data);
        } else {
          setError(data.error || "La respuesta de la API de eventos no fue exitosa.");
        }
      } else {
        setError("Error al cargar los eventos desde el servidor.");
      }
    } catch (err) {
      setError("No se pudieron cargar los eventos.");
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  useEffect(() => {
    if (!selectedEvento) {
      setCampanas([]);
      return;
    }

    const fetchCampanas = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/campanas/evento/${selectedEvento}`);
        if (response.ok) {
          const data = await response.json();

          if (data.success && Array.isArray(data.data.campaigns)) {
            setCampanas(data.data.campaigns);
          } else {
            setCampanas([]);
          }
        } else {
          setError("No se pudieron cargar las campañas.");
        }
      } catch (err) {
        setError("Error de red al cargar las campañas.");
      } finally {
        setLoading(false);
      }
    };

    fetchCampanas();
  }, [selectedEvento]);


  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Visualización de Campañas</h1>

        <Select onValueChange={setSelectedEvento} value={selectedEvento}>
          <SelectTrigger className="w-full mb-6 max-w-lg mx-auto">
            <SelectValue placeholder="Selecciona un evento para ver sus campañas" />
          </SelectTrigger>
          <SelectContent>
            {eventos.map((evento) => (
              <SelectItem key={evento.id_evento} value={String(evento.id_evento)}>
                {evento.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEvento && (
          <>
            {loading && <p className="text-center">Cargando campañas...</p>}

            {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

            {!loading && !error && (
              <>
                {campanas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campanas.map((campana) => (
                      // --- INICIO DE LA MODIFICACIÓN ---
                      <Card key={campana.id_campana} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Megaphone className="h-5 w-5 text-primary" />
                            <span>{campana.nombre}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-grow">
                          <div className="text-sm text-gray-600">
                            {campana.subevento_nombre || "Evento principal"}
                          </div>
                          {campana.fecha_personalizada && (
                             <div className="flex items-center space-x-2 text-sm text-gray-600">
                               <Calendar size={16} />
                               <span>{campana.fecha_personalizada}</span>
                             </div>
                          )}
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-2 pt-4">
                            {/* Botón 1: Ir a la gestión de campañas */}
                            <Button variant="secondary" size="sm" asChild>
                                <Link href={`/eventos/${campana.id_evento}/campanas`}>
                                    Ir a campañas
                                    <Settings className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                            
                            {/* Botón 2: Ver la landing page pública */}
                            {campana.url_amigable && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center justify-center gap-2"
                                  asChild
                                >
                                  <a
                                    href={`/c/${campana.url_amigable}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Ver landing
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                            )}
                        </CardFooter>
                         {/* --- FIN DE LA MODIFICACIÓN --- */}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-8">
                    No se encontraron campañas para el evento seleccionado.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CampanasPorEventoPage;