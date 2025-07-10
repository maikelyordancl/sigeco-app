"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Ticket, Edit } from "lucide-react";
import { CrearSubCampañaDialog } from "@/components/dialogs/CrearSubCampañaDialog";
import { GestionTicketsDialog } from "@/components/dialogs/GestionTicketsDialog";
import { EditarCampanaDialog } from "@/components/dialogs/EditarCampanaDialog"; // 1. IMPORTAMOS el nuevo diálogo
import MainLayout from "@/components/Layout/MainLayout";
import toast from "react-hot-toast";

// Tipos
interface Campana {
  id_campana: number;
  nombre: string;
  tipo_acceso: "Gratuito" | "De Pago";
  estado: "Borrador" | "Activa" | "Pausada" | "Finalizada";
  url_amigable: string;
  id_subevento: number | null;
  subevento_nombre?: string;
}

const GestionCampanasPage = () => {
  const router = useRouter();
  const params = useParams();
  const id_evento = params.id as string;

  const [campanaPrincipal, setCampanaPrincipal] = useState<Campana | null>(null);
  const [subCampanas, setSubCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isTicketsModalOpen, setTicketsModalOpen] = useState(false);
  const [selectedCampanaId, setSelectedCampanaId] = useState<number | null>(null);
  
  // --- 2. AÑADIMOS NUEVOS ESTADOS para el modal de EDICIÓN ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [campanaToEdit, setCampanaToEdit] = useState<Campana | null>(null);
  // --- Fin de los nuevos estados ---

  const fetchCampanas = useCallback(async () => {
    if (!id_evento) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/campanas/evento/${id_evento}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("No se pudieron obtener las campañas.");
      const responseData = await res.json();
      if (responseData.success && Array.isArray(responseData.data)) {
        const campanas: Campana[] = responseData.data;
        setCampanaPrincipal(campanas.find((c) => !c.id_subevento) || null);
        setSubCampanas(campanas.filter((c) => !!c.id_subevento));
      } else {
        throw new Error(responseData.message || "La respuesta de la API no tiene el formato esperado.");
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar las campañas.");
      setCampanaPrincipal(null);
      setSubCampanas([]);
    } finally {
      setLoading(false);
    }
  }, [id_evento]);

  useEffect(() => {
    fetchCampanas();
  }, [fetchCampanas]);

  const handleOpenTicketsModal = (id_campana: number) => {
    setSelectedCampanaId(id_campana);
    setTicketsModalOpen(true);
  };

  // --- 3. AÑADIMOS LAS FUNCIONES para abrir y cerrar el modal de EDICIÓN ---
  const handleOpenEditModal = (campana: Campana) => {
    setCampanaToEdit(campana);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCampanaToEdit(null);
  };

  const onCampañaChange = () => {
    fetchCampanas();
  };
  
  const onCampañaActualizada = () => {
    handleCloseEditModal();
    onCampañaChange();
  }

  const renderCard = (campana: Campana) => (
    <Card key={campana.id_campana} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{campana.nombre}</CardTitle>
          <Badge
            className={campana.estado === "Activa" ? "bg-green-600 text-white" : ""}
          >
            {campana.estado}
          </Badge>
        </div>
        <CardDescription>
          {campana.tipo_acceso} - {campana.subevento_nombre || "Evento Principal"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-500 break-all">
          URL:{" "}
          <a
            href={`/${campana.url_amigable}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            /{campana.url_amigable}
          </a>
        </p>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 pt-4">
        {/* --- 4. ACTIVAMOS EL BOTÓN Y LE AÑADIMOS EL onClick --- */}
        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(campana)}>
          <Edit className="mr-2 h-4 w-4" /> Editar
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => handleOpenTicketsModal(campana.id_campana)}
          disabled={campana.tipo_acceso === "Gratuito"}
        >
          <Ticket className="mr-2 h-4 w-4" /> Tickets
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.push("/eventos/gestion")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-center">Gestión de Campañas</h1>
          <Button onClick={() => setCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Sub-Campaña
          </Button>
        </div>
        
        {loading ? (
           <p className="text-center py-10">Cargando campañas...</p>
        ) : (
          <>
            {campanaPrincipal && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 border-l-4 border-blue-600 pl-3">Campaña Principal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderCard(campanaPrincipal)}
                </div>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold mb-4 border-l-4 border-blue-600 pl-3">Sub-Campañas</h2>
              {subCampanas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subCampanas.map(renderCard)}
                </div>
              ) : (
                <div className="text-center py-10 border-dashed border-2 rounded-lg mt-4">
                  <p className="text-gray-500">No hay sub-campañas para este evento.</p>
                </div>
              )}
            </div>
            {/* Mensaje de no encontradas */}
          </>
        )}
      </div>

      <CrearSubCampañaDialog
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        id_evento={parseInt(id_evento)}
        onSubCampañaCreada={() => {
            setCreateModalOpen(false);
            toast.success("Sub-campaña creada. Actualizando...");
            onCampañaChange();
        }}
      />
      
      <GestionTicketsDialog
        isOpen={isTicketsModalOpen}
        onClose={() => setSelectedCampanaId(null)}
        id_campana={selectedCampanaId}
        onTicketChange={onCampañaChange}
      />
      
      {/* --- 5. RENDERIZAMOS EL DIÁLOGO DE EDICIÓN --- */}
      <EditarCampanaDialog
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        campana={campanaToEdit}
        onCampanaActualizada={onCampañaActualizada}
      />
    </MainLayout>
  );
};

export default GestionCampanasPage;