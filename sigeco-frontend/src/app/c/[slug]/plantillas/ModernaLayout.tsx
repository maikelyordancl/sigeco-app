'use client';

import React, { useEffect } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { CraftButton } from '@/components/craft/CraftButton';
import { CraftContainer } from '@/components/craft/CraftContainer';
import { CraftImage } from '@/components/craft/CraftImage';
import { CraftText } from '@/components/craft/CraftText';
import { CraftVideo } from '@/components/craft/CraftVideo';
import { CraftSpacer } from '@/components/craft/CraftSpacer';
import { CraftColumns } from '@/components/craft/CraftColumns';
import RegistrationForm from '../RegistrationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Info } from 'lucide-react';

import type { CampanaPublica, Ticket, FormularioConfig } from '../types';

type Props = {
  data: {
    campana: CampanaPublica;
    tickets: Ticket[];
    formulario: FormularioConfig | any; // tolerante a {campos:[]} o []
  } | null;
};

const LandingRenderer = ({ jsonContent }: { jsonContent?: string | null }) => {
  const { actions } = useEditor();

  useEffect(() => {
    // Fallback válido usando nombres del resolver como strings
    const fallback = JSON.stringify({
      ROOT: {
        type: { resolvedName: 'CraftContainer' },
        isCanvas: true,
        props: { className: 'space-y-6' },
        displayName: 'ROOT',
        nodes: ['hero'],
      },
      hero: {
        type: { resolvedName: 'CraftContainer' },
        isCanvas: true,
        props: { className: 'p-8 bg-gray-50 rounded-xl' },
        displayName: 'Hero',
        nodes: ['heroText'],
      },
      heroText: {
        type: { resolvedName: 'CraftText' },
        props: {
          text: 'Bienvenido. Esta página aún no tiene un contenido personalizado.',
          className: 'text-2xl font-semibold',
        },
        displayName: 'Text',
        isCanvas: false,
        nodes: [],
      },
    });

    if (!jsonContent || jsonContent === 'null') {
      actions.deserialize(fallback);
      return;
    }

    try {
      actions.deserialize(jsonContent);
    } catch {
      actions.deserialize(fallback);
    }
  }, [jsonContent, actions]);

  return (
    <Frame>
      <Element is={CraftContainer} canvas id="main-content" className="min-h-full" />
    </Frame>
  );
};

const InfoCard = ({ campana }: { campana: CampanaPublica }) => {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  // Fechas opcionales
  const fechaInicio = (campana as any)?.fecha_inicio as string | undefined;
  const fechaFin = (campana as any)?.fecha_fin as string | undefined;

  if (!fechaInicio || !fechaFin) return null;

  return (
    <div className="flex items-center justify-center text-gray-700 mt-2">
  <Calendar className="h-5 w-5 mr-3 text-gray-500" />
  <span>
    {formatDate(fechaInicio)} - {formatDate(fechaFin)}
  </span>
</div>
  );
};

const ModernaLayout: React.FC<Props> = ({ data }) => {
  if (!data) return null;
  const { campana, tickets, formulario } = data;
  const isSubCampaign = Boolean((campana as any)?.id_subevento);

  return (
    <div className="bg-white min-h-full">
      <main className="container mx-auto px-4 py-8">
        {/* Títulos centrados, mismo ancho que el flyer */}
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {(campana as any)?.evento_nombre}
          </h1>
          {(campana as any)?.nombre && (
            <h3 className="text-xl font-semibold text-gray-700 mt-1">
              {(campana as any).nombre}
            </h3>
          )}
          <InfoCard campana={campana} />
        </div>

        {/* Flyer / contenido Craft */}
        <Card className="mt-6 max-w-3xl mx-auto">
          <CardContent className="p-3 sm:p-6">
            <Editor
              enabled={false}
              resolver={{
                CraftContainer,
                CraftText,
                CraftColumns,
                CraftImage,
                CraftVideo,
                CraftButton,
                CraftSpacer,
              }}
            >
              <LandingRenderer jsonContent={(campana as any).landing_page_json ?? null} />
            </Editor>
          </CardContent>
        </Card>

        {/* Formulario (mismo ancho del flyer) */}
        {isSubCampaign ? (
          <div className="mt-6 max-w-3xl mx-auto">
            <RegistrationForm campana={campana} tickets={tickets} formulario={formulario} />
          </div>
        ) : (
          <div className="mt-6 max-w-3xl mx-auto">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center gap-3">
                <Info className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-blue-800">Página Informativa del Evento</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700">
                <p>
                  Las inscripciones y venta de entradas se realizan en las páginas de cada
                  actividad específica.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ModernaLayout;
