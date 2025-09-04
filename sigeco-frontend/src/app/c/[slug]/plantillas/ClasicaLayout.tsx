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
    formulario: FormularioConfig;
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

  // Fechas opcionales (no forman parte del tipo, pero pueden venir)
  const fechaInicio = (campana as any)?.fecha_inicio as string | undefined;
  const fechaFin = (campana as any)?.fecha_fin as string | undefined;

  return (
    <div className="space-y-3">
      {fechaInicio && fechaFin ? (
        <div className="flex items-center text-gray-700">
          <Calendar className="h-5 w-5 mr-3 text-gray-500" />
          <span>
            {formatDate(fechaInicio)} - {formatDate(fechaFin)}
          </span>
        </div>
      ) : null}
    </div>
  );
};

const ClasicaLayout: React.FC<Props> = ({ data }) => {
  if (!data) return null;
  const { campana, tickets, formulario } = data;

  // id_subevento puede no existir en el tipo; lo tratamos como opcional
  const isSubCampaign = Boolean((campana as any)?.id_subevento);

  return (
    <div className="bg-white min-h-full">
      <main
        className={`container mx-auto py-8 px-4 grid grid-cols-1 ${
          isSubCampaign ? 'md:grid-cols-3' : ''
        } gap-8`}
      >
        {/* Columna Izquierda */}
        <div className={isSubCampaign ? 'md:col-span-2' : ''}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{campana.evento_nombre}</h1>
            {(campana as any)?.subevento_nombre && (
              <p className="text-lg text-gray-600">{(campana as any).subevento_nombre}</p>
            )}
            <hr className="my-4 border-gray-300" />
            <InfoCard campana={campana} />
          </div>

          <hr className="my-8 border-gray-200" />

          {/* Render del JSON de Craft */}
          <div className="min-h-[200px]">
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
              <LandingRenderer jsonContent={campana.landing_page_json ?? null} />
            </Editor>
          </div>

          {!isSubCampaign && (
            <div className="mt-8 md:col-span-3">
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
        </div>

        {/* Columna Derecha (Formulario) */}
        {isSubCampaign && (
          <aside className="md:col-span-1">
            <div className="sticky top-8">
              <RegistrationForm campana={campana} tickets={tickets} formulario={formulario} />
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default ClasicaLayout;
