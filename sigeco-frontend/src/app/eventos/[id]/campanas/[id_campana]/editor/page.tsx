"use client";

import { useState, useEffect } from "react";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { CraftContainer } from "@/components/craft/CraftContainer";
import { CraftText } from "@/components/craft/CraftText";
import { CraftImage } from "@/components/craft/CraftImage";
import { CraftVideo } from "@/components/craft/CraftVideo";
import { CraftButton } from "@/components/craft/CraftButton";
import { CraftSpacer } from "@/components/craft/CraftSpacer";
import { CraftColumns } from "@/components/craft/CraftColumns";
import { Toolbox } from "@/components/craft/Toolbox";
import { SettingsPanel } from "@/components/craft/SettingsPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Save } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { LandingPagePresenter } from "@/app/c/[slug]/LandingPagePresenter";
import { CampanaData } from "@/app/c/[slug]/types";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";

const ProcesoInscripcionPlaceholder = () => (
    <div className="text-center p-4 border-dashed border-2 rounded-md bg-gray-50">
        <p className="text-sm text-gray-500">Área del Formulario de Inscripción</p>
        <p className="text-xs text-gray-400">(No editable desde aquí)</p>
    </div>
);

const EditorPageContent = () => {
    const router = useRouter();
    const params = useParams();
    const id_evento = params.id as string;
    const id_campana = params.id_campana as string;

    const { query } = useEditor();
    const [data, setData] = useState<CampanaData | null>(null);
    const [landingJson, setLandingJson] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!id_campana) return;

        const fetchAndLoadCampaign = async () => {
            setLoading(true);
            setError(null);
            try {
                const campanaRes = await apiFetch(`/campanas/${id_campana}`, {
                });
                const campanaData = await campanaRes.json();
                if (!campanaData.success) throw new Error("No se pudo cargar la campaña.");
                const slug = campanaData.data.url_amigable;

                const response = await apiFetch(`/public/campana/${slug}`);
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo cargar la información de la landing.');
                
                setData(result.data);
                
                const jsonString = result.data.campana.landing_page_json;
                if (jsonString && jsonString !== "null") {
                    setLandingJson(jsonString);
                }
                
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAndLoadCampaign();
    }, [id_campana]);

    const handleSave = async () => {
        const json = query.serialize();
        const toastId = toast.loading("Guardando cambios...");

        try {
            const response = await apiFetch(`/campanas/${id_campana}/landing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ landing_page_json: json }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "No se pudo guardar la landing page.");

            toast.success("Landing page guardada con éxito", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><p>Cargando editor...</p></div>;
    if (error) return <div className="flex flex-col justify-center items-center h-screen bg-red-50 text-red-700"><AlertTriangle className="h-16 w-16 mb-4" /><h1 className="text-2xl font-bold">Error al cargar el editor</h1><p>{error}</p><Button onClick={() => router.back()} className="mt-6">Volver</Button></div>;
    if (!data) return <div className="flex justify-center items-center h-screen"><p>No se encontraron datos para esta campaña.</p></div>;

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
                <Button variant="outline" onClick={() => router.push(`/eventos/${id_evento}/campanas`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <h1 className="text-lg font-semibold">Editor: {data.campana.nombre}</h1>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
            </header>

            <div className="flex-grow grid grid-cols-12 overflow-hidden">
                <aside className="col-span-2 bg-white p-2 border-r overflow-y-auto"><Toolbox /></aside>

               <main className="col-span-7 bg-gray-200 overflow-auto">
  <Frame json={landingJson ?? undefined}>
    <Element is={CraftContainer} canvas id="main-content" className="min-h-full">
      <LandingPagePresenter data={data} form={<ProcesoInscripcionPlaceholder />} />
    </Element>
  </Frame>
</main>


                <aside className="col-span-3 bg-white p-2 border-l overflow-y-auto"><SettingsPanel /></aside>
            </div>
        </div>
    );
};

export default function EditorPage() {
    return (
        <Editor
            resolver={{
                CraftContainer, CraftText, CraftColumns, CraftImage,
                CraftVideo, CraftButton, CraftSpacer
            }}>
            <EditorPageContent />
        </Editor>
    );
}