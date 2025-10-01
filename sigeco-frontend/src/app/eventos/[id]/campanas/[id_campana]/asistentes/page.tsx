"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AsistentesTable } from "./AsistentesTable";
import { AsistenteDetalleSheet } from "./AsistenteDetalleSheet";
import { apiFetch } from "@/lib/api";
import { Asistente, CampoFormulario, EstadoAsistencia } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const ALL_STATUS = "__ALL__";

export default function AsistentesPage() {
  const params = useParams();
  const id_evento = params.id as string;
  const id_campana = params.id_campana as string;
  const router = useRouter();

  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedAsistente, setSelectedAsistente] = useState<Asistente | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [campanaInfo, setCampanaInfo] = useState<any>(null);
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>([]);
  const [eventoInfo, setEventoInfo] = useState<any>(null);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInscripciones, setTotalInscripciones] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const [estadoFiltro, setEstadoFiltro] = useState<string>(ALL_STATUS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- INICIO DE LA MODIFICACIÓN ---
  // Aumentamos el tiempo de espera para una escritura más fluida.
  const debouncedSearchTerm = useDebounce(searchTerm, 700);
  // --- FIN DE LA MODIFICACIÓN ---

  const fetchData = useCallback(async () => {
    if (!id_campana || !id_evento) return;
    
    setIsRefreshing(true);

    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (debouncedSearchTerm) {
        queryParams.append('search', debouncedSearchTerm);
    }
    if (estadoFiltro !== ALL_STATUS) {
        queryParams.append('estado', estadoFiltro);
    }

    try {
      const [asistentesRes, campanaRes, formularioRes, eventoRes] = await Promise.all([
        apiFetch(`/campanas/${id_campana}/asistentes-v2?${queryParams.toString()}`),
        apiFetch(`/campanas/${id_campana}`),
        apiFetch(`/campanas/${id_campana}/formulario`),
        apiFetch(`/eventos/${id_evento}`),
      ]);

      if (!asistentesRes.ok || !campanaRes.ok || !formularioRes.ok || !eventoRes.ok) {
        throw new Error("Error al obtener los datos de la campaña");
      }

      const asistentesData = await asistentesRes.json();
      const campanaData = await campanaRes.json();
      const formularioData = await formularioRes.json();
      const eventoData = await eventoRes.json();
      
      const arr = Array.isArray(asistentesData.asistentes) ? asistentesData.asistentes : [];

      setAsistentes(arr);
      setTotalInscripciones(asistentesData.totalInscripciones ?? 0);
      setTotalPages(asistentesData.totalPages ?? 1);
      setStatusCounts(asistentesData.statusCounts ?? {});
      
      setCampanaInfo(campanaData.data);
      setCamposFormulario(formularioData.data || []);
      setEventoInfo(eventoData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
        setInitialLoading(false);
        setIsRefreshing(false);
    }
  }, [id_campana, id_evento, page, limit, debouncedSearchTerm, estadoFiltro]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, estadoFiltro]);
  
  const handleEditAsistente = (asistente: Asistente) => {
    setSelectedAsistente(asistente);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedAsistente(null), 150);
  };

  const handleAsistenteUpdate = (updatedAsistente: Asistente) => {
    setAsistentes(currentAsistentes =>
      currentAsistentes.map(a =>
        a.id_inscripcion === updatedAsistente.id_inscripcion ? updatedAsistente : a
      )
    );
  };

  const handleEstadoChange = async (id_inscripcion: number, nuevoEstado: EstadoAsistencia) => {
    setAsistentes(currentAsistentes =>
      currentAsistentes.map(a =>
        a.id_inscripcion === id_inscripcion ? { ...a, estado_asistencia: nuevoEstado } : a
      )
    );

    try {
      const response = await apiFetch(`/campanas/asistentes/${id_inscripcion}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado_asistencia: nuevoEstado }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado.');
      }
      toast.success('Estado actualizado');
      fetchData(); 
    } catch (error) {
      toast.error('Error al actualizar. Intente de nuevo.');
      console.error("Error actualizando estado:", error);
      fetchData();
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (initialLoading) return <div className="p-10">Cargando asistentes...</div>;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pt-3 pb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold leading-tight m-0">
              {eventoInfo ? `${id_evento.toString().padStart(4, "00")} - ${eventoInfo.nombre}` : `Evento`}
            </h1>
            <h3 className="text-xl font-semibold leading-snug m-0">
              {campanaInfo?.nombre || 'Campaña'}
            </h3>
            <p className="text-muted-foreground m-0">Lista de Usuarios</p>
          </div>

          <Button
            onClick={() => router.push(`/eventos/${id_evento}/campanas`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a las campañas
          </Button>
        </div>

        <AsistentesTable
          data={asistentes}
          onEdit={handleEditAsistente}
          id_campana={id_campana}
          camposFormulario={camposFormulario}
          onEstadoChange={handleEstadoChange}
          limit={limit}
          onLimitChange={(nuevo) => {
            setPage(1);
            setLimit(nuevo);
          }}
          page={page}
          totalPages={totalPages}
          totalInscripciones={totalInscripciones}
          onPageChange={handlePageChange}
          statusCounts={statusCounts}
          onRefreshData={fetchData}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          estadoFiltro={estadoFiltro}
          onEstadoFiltroChange={setEstadoFiltro}
          isRefreshing={isRefreshing}
        />

        {selectedAsistente && campanaInfo && (
          <AsistenteDetalleSheet
            isOpen={isSheetOpen}
            onClose={handleSheetClose}
            asistente={selectedAsistente}
            campanaInfo={campanaInfo}
            id_campana={id_campana}
            onUpdate={handleAsistenteUpdate}
          />
        )}
      </div>
    </MainLayout>
  );
}