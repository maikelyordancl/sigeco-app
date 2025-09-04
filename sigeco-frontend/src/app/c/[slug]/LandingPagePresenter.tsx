"use client";

import { ReactNode } from "react";
import { Calendar, MapPin, Ticket, UserPlus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CampanaData } from "./types";

const InfoCard = ({ campana }: { campana: CampanaData['campana'] }) => {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
        <div className="space-y-3">
          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-3 text-gray-500" />
            <span>{formatDate(campana.fecha_inicio)} - {formatDate(campana.fecha_fin)}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <MapPin className="h-5 w-5 mr-3 text-gray-500" />
            <span>{campana.ciudad}, {campana.lugar}</span>
          </div>
        </div>
  );
};

interface LandingPagePresenterProps {
  data: CampanaData;
  children: ReactNode;
  // *** CORRECCIÓN: Hacemos la prop 'form' opcional ***
  form?: ReactNode;
}

export const LandingPagePresenter = ({ data, children, form }: LandingPagePresenterProps) => {
  const { campana } = data;
  const isSubCampaign = !!campana.id_subevento;

  return (
    // Ya no hay <header>, todo empieza en el <main>
    <div className="bg-white min-h-full">
      <main className={`container mx-auto py-8 px-4 grid grid-cols-1 ${isSubCampaign ? 'md:grid-cols-3' : ''} gap-8`}>
        
        {/* Columna Izquierda (2/3 del ancho en escritorio) */}
        <div className={isSubCampaign ? 'md:col-span-2' : ''}>
          
          {/* INFORMACIÓN DEL EVENTO (lo que antes era el header) */}
<div className="mb-8"> {/* Un div para agrupar y dar espacio debajo */}
  <h1 className="text-3xl font-bold text-gray-800">
    {campana.evento_nombre}
  </h1>
  <p className="text-lg text-gray-600">
    {campana.subevento_nombre || 'Evento Principal'}
  </p>
  {/* Línea divisoria después del subevento */}
  <hr className="my-4 border-gray-300" />

  <InfoCard campana={campana} />
</div>

          <hr className="my-8 border-gray-200" />

          {/* Aquí se renderizará el banner o contenido principal (children) */}
          {children}
         
        </div>
        
        
        {/* Columna Derecha (Formulario) */}
        {isSubCampaign && (
          <aside className="md:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {campana.obligatorio_pago ? <Ticket className="h-6 w-6 mr-3" /> : <UserPlus className="h-6 w-6 mr-3" />}
                  Inscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                {form}
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Mensaje para evento principal (sin formulario) */}
        {!isSubCampaign && (
          <div className="mt-8 md:col-span-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center gap-3">
                <Info className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-blue-800">Página Informativa del Evento</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700">
                <p>Las inscripciones y venta de entradas se realizan en las páginas de cada actividad específica.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};