// sigeco-frontend/src/app/eventos/[id]/campanas/page.tsx

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
import { ArrowLeft, PlusCircle, Ticket, Edit, Send, Settings, Users, Calendar } from "lucide-react"; // Añadido Calendar
import { CrearSubCampanaDialog } from "@/components/dialogs/CrearSubCampanaDialog";
import { GestionTicketsDialog } from "@/components/dialogs/GestionTicketsDialog";
import { EditarCampanaDialog } from "@/components/dialogs/EditarCampanaDialog";
import { FormularioConfigDialog } from "@/components/dialogs/FormularioConfigDialog";
import MainLayout from "@/components/Layout/MainLayout";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";
import { CampanaAdmin } from "@/app/c/[slug]/types";

const GestionCampanasPage = () => {
  const router = useRouter();
  const params = useParams();
  const id_evento = params.id as string;

  // ... (estados y funciones sin cambios)
  const [eventName, setEventName] = useState<string>('');
  const [campanaPrincipal, setCampanaPrincipal] = useState<CampanaAdmin | null>(null);
  const [subCampanas, setSubCampanas] = useState<CampanaAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isTicketsModalOpen, setTicketsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFormConfigModalOpen, setFormConfigModalOpen] = useState(false);

  const [selectedCampanaId, setSelectedCampanaId] = useState<number | null>(null);
  const [campanaToEdit, setCampanaToEdit] = useState<CampanaAdmin | null>(null);

  const fetchCampanas = useCallback(async () => {
    if (!id_evento) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/campanas/evento/${id_evento}`);

      if (!res.ok) throw new Error("No se pudieron obtener las campañas.");
      const responseData = await res.json();
      
      if (responseData.success && responseData.data) {
        const { eventName, campaigns } = responseData.data;
        setEventName(eventName);
        setCampanaPrincipal(campaigns.find((c: CampanaAdmin) => !c.id_subevento) || null);
        setSubCampanas(campaigns.filter((c: CampanaAdmin) => !!c.id_subevento));
      } else {
        throw new Error(responseData.message || "La respuesta de la API no tiene el formato esperado.");
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar las campañas.");
      setEventName('');
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

  const handleOpenEditModal = (campana: CampanaAdmin) => {
    setCampanaToEdit(campana);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCampanaToEdit(null);
  };

  const handleOpenFormConfigModal = (id_campana: number) => {
    setSelectedCampanaId(id_campana);
    setFormConfigModalOpen(true);
  };

  const onCampanaChange = () => fetchCampanas();

  const onCampanaActualizada = () => {
    handleCloseEditModal();
    onCampanaChange();
  };

  const getTipoAccesoTexto = (campana: CampanaAdmin) => {
    if (campana.id_subevento === null) return "Informativa";
    return campana.obligatorio_pago ? "De Pago" : "Gratuito";
  };

  const handleGoToConvocatoria = (id_campana: number) => {
    router.push(`/eventos/${id_evento}/campanas/${id_campana}/convocatoria`);
  };

  const handleGoToEditor = (id_campana: number) => {
    router.push(`/eventos/${id_evento}/campanas/${id_campana}/editor`);
  };
  const handleGoToAsistentes = (id_campana: number) => {
    router.push(`/eventos/${id_evento}/campanas/${id_campana}/asistentes`);
  };


  const renderCard = (campana: CampanaAdmin) => (
    <Card key={campana.id_campana} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        {/* ... (código de CardHeader sin cambios) ... */}
        <div className="flex justify-between items-start">
          <CardTitle>{campana.nombre}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={campana.estado === "Activa" ? "bg-green-600 text-white" : ""}>{campana.estado}</Badge>
            <Button variant="secondary" size="sm" onClick={() => handleGoToAsistentes(campana.id_campana)} disabled={!campana.id_subevento}>
              <Users className="mr-2 h-4 w-4" /> Asistentes
            </Button>
            {!!campana.id_subevento && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenFormConfigModal(campana.id_campana)}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {getTipoAccesoTexto(campana)} - {campana.subevento_nombre || "Evento Principal"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        {campana.fecha_personalizada && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{campana.fecha_personalizada}</span>
          </div>
        )}
        {/* --- FIN DE LA MODIFICACIÓN --- */}
        <p className="text-sm text-gray-500 break-all">
          URL:{" "}
          <a href={`/c/${campana.url_amigable}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            /c/{campana.url_amigable}
          </a>
        </p>
        <div className="mt-4 border-t pt-2 text-sm">
          <h4 className="font-semibold mb-1">Asistencia:</h4>
          {/* ... (código de estadísticas sin cambios) ... */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {!campana.obligatorio_registro && !campana.obligatorio_pago && (
              <>
                <p>Invitados: <span className="font-bold">{campana.invitados || 0}</span></p>
                <p>Asistieron: <span className="font-bold">{campana.asistieron || 0}</span></p>
              </>
            )}
            {campana.obligatorio_registro && !campana.obligatorio_pago && (
              <>
                <p>Registrados: <span className="font-bold">{campana.registrados || 0}</span></p>
                <p>Confirmados: <span className="font-bold">{campana.confirmados || 0}</span></p>
                <p>Asistieron: <span className="font-bold">{campana.asistieron || 0}</span></p>
              </>
            )}
            {campana.obligatorio_registro && campana.obligatorio_pago && (
              <>
                <p>Registrados: <span className="font-bold">{campana.registrados || 0}</span></p>
                <p>Confirmados: <span className="font-bold">{campana.confirmados || 0}</span></p>
                <p>Pagados: <span className="font-bold text-green-600">{campana.pagados || 0}</span></p>
                <p>Asistieron: <span className="font-bold">{campana.asistieron || 0}</span></p>
              </>
            )}
            {!!campana.cancelados && <p className="text-red-600">Cancelados: <span className="font-bold">{campana.cancelados}</span></p>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 lg:grid-cols-5 gap-2 pt-4">
        {/* ... (código de CardFooter sin cambios) ... */}
         <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(campana)}>
          <Edit className="mr-2 h-4 w-4" /> Config.
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleGoToEditor(campana.id_campana)} disabled={!campana.id_subevento}>
          <Edit className="mr-2 h-4 w-4" /> Landing
        </Button>
        <Button variant="default" size="sm" onClick={() => handleOpenTicketsModal(campana.id_campana)} disabled={!campana.obligatorio_pago}>
          <Ticket className="mr-2 h-4 w-4" /> Tickets
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleGoToConvocatoria(campana.id_campana)} disabled={!campana.id_subevento}>
          <Send className="mr-2 h-4 w-4" /> Convocar
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    // ... (resto del componente sin cambios)
     <MainLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.push("/eventos/gestion")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Gestión de Campañas{eventName && `: ${eventName}`}
          </h1>
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
          </>
        )}
      </div>

      <CrearSubCampanaDialog
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        id_evento={parseInt(id_evento)}
        onSubCampanaCreada={() => {
          setCreateModalOpen(false);
          toast.success("Sub-campaña creada. Actualizando...");
          onCampanaChange();
        }}
      />

      <GestionTicketsDialog
        isOpen={isTicketsModalOpen}
        onClose={() => setTicketsModalOpen(false)}
        id_campana={selectedCampanaId}
        onTicketChange={onCampanaChange}
      />

      <EditarCampanaDialog
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        campana={campanaToEdit}
        onCampanaActualizada={onCampanaActualizada}
      />

      <FormularioConfigDialog
        isOpen={isFormConfigModalOpen}
        onClose={() => setFormConfigModalOpen(false)}
        id_campana={selectedCampanaId}
      />
    </MainLayout>
  );
};

export default GestionCampanasPage;