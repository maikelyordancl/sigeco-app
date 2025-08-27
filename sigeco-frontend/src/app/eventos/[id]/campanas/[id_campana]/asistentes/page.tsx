"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AsistentesTable } from "./AsistentesTable";
import { AsistenteDetalleSheet } from "./AsistenteDetalleSheet";
import { apiFetch } from "@/lib/api";
import { Asistente, CampoFormulario } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
// --- MODIFICACIÓN: Importar toast ---
import toast from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";

export default function AsistentesPage() {
  const params = useParams();
  const id_evento = params.id as string;
  const id_campana = params.id_campana as string;
  const router = useRouter();

  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsistente, setSelectedAsistente] = useState<Asistente | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [campanaInfo, setCampanaInfo] = useState<any>(null);
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>([]);


  const fetchData = useCallback(async () => {
    if (!id_campana) return;
    setLoading(true);
    try {
      const [asistentesRes, campanaRes, formularioRes] = await Promise.all([
        apiFetch(`/campanas/${id_campana}/asistentes-v2`),
        apiFetch(`/campanas/${id_campana}`),
        apiFetch(`/campanas/${id_campana}/formulario`)
      ]);

      if (!asistentesRes.ok || !campanaRes.ok || !formularioRes.ok) {
        throw new Error("Error al obtener los datos de la campaña");
      }

      const asistentesData = await asistentesRes.json();
      const campanaData = await campanaRes.json();
      const formularioData = await formularioRes.json();

      setAsistentes(asistentesData);
      setCampanaInfo(campanaData.data);
      setCamposFormulario(formularioData.data || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [id_campana]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // --- NUEVA FUNCIÓN PARA CAMBIAR EL ESTADO DESDE LA TABLA ---
  const handleEstadoChange = async (id_inscripcion: number, nuevoEstado: string) => {
    // 1. Actualización optimista de la UI
    setAsistentes(currentAsistentes =>
      currentAsistentes.map(a =>
        a.id_inscripcion === id_inscripcion ? { ...a, estado_asistencia: nuevoEstado } : a
      )
    );

    try {
      // 2. Llamada a la API en segundo plano
      const response = await apiFetch(`/campanas/asistentes/${id_inscripcion}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado_asistencia: nuevoEstado }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado.');
      }
      toast.success('Estado actualizado');

    } catch (error) {
      // 3. Si falla, revertir el cambio en la UI y notificar
      toast.error('Error al actualizar. Intente de nuevo.');
      console.error("Error actualizando estado:", error);
      fetchData(); // Recargamos los datos para asegurar consistencia
    }
  };


  if (loading) return <div className="p-10">Cargando asistentes...</div>;

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {campanaInfo?.nombre || 'Campaña'}
            </h1>
            <p className="text-muted-foreground">Lista de Asistentes</p>
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
          // --- MODIFICACIÓN: Pasar la nueva función a la tabla ---
          onEstadoChange={handleEstadoChange}
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