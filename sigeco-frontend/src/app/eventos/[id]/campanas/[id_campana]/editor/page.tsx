"use client";

import { useState, useEffect, useRef } from "react";
import { Editor as TinyEditor } from '@tinymce/tinymce-react';
import { Editor as CraftEditor, Frame, Element, useEditor } from "@craftjs/core";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

// Componentes de Craft.js (tu editor de landing)
import { CraftContainer } from "@/components/craft/CraftContainer";
import { CraftText } from "@/components/craft/CraftText";
import { CraftImage } from "@/components/craft/CraftImage";
import { CraftVideo } from "@/components/craft/CraftVideo";
import { CraftButton } from "@/components/craft/CraftButton";
import { CraftSpacer } from "@/components/craft/CraftSpacer";
import { CraftColumns } from "@/components/craft/CraftColumns";
import { Toolbox } from "@/components/craft/Toolbox";
import { SettingsPanel } from "@/components/craft/SettingsPanel";
import { LandingPagePresenter } from "@/app/c/[slug]/LandingPagePresenter";

// Componentes de UI de ShadCN
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, Save, Mail, LayoutTemplate } from "lucide-react";

// Utilidades
import { apiFetch } from "@/lib/api";
import { CampanaData } from "@/app/c/[slug]/types";

// Plantilla de correo por defecto que se usará como base.
const getDefaultEmailHtml = (eventName: string) => {
  // Usamos placeholders para los datos que serán reemplazados por el backend al momento del envío.
  return `
  <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación Inscripción ${eventName}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f0f0f0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width:600px; margin:20px auto; background:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.1); border-radius:8px; overflow:hidden;">
        
        <div style="padding:20px;">
          <h2 style="margin:0; padding:0; text-align:center; color:#000;">
            <span style="background-color:#4cd964; padding:6px 12px; border-radius:4px; display:inline-block;">
              ¡Confirmación de tu inscripción al ${eventName}!
            </span>
          </h2>
        </div>

        <div style="padding:20px; font-size:16px; line-height:1.6; color:#000;">
          <p>Hola {{nombre_asistente}},</p>
          <p>¡Excelente! Tu inscripción para el 
            <strong>${eventName}</strong>, ha sido confirmada exitosamente.
          </p>

          <p><strong style="color:#008c23;">Fecha del evento:</strong> {{fecha_evento}}.</p>
          <p><strong style="color:#008c23;">Lugar:</strong> {{lugar_evento}}.</p>
          <p><strong style="color:#008c23;">Para ingresar:</strong> Presenta tu carnet de identidad en la entrada.</p>

          <p>Saludos cordiales,</p>
          <p><strong>Equipo</strong><br><i>Emov Biobío</i></p>
        </div>

        <div style="border-top:1px solid #DFE3E8; padding:15px; text-align:center; font-size:12px; color:#888;">
          <p>Este es un correo automático, por favor no responder.</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

// Componente placeholder para el formulario (sin cambios)
const ProcesoInscripcionPlaceholder = () => (
    <div className="text-center p-4 border-dashed border-2 rounded-md bg-gray-50">
        <p className="text-sm text-gray-500">Área del Formulario de Inscripción</p>
        <p className="text-xs text-gray-400">(No editable desde aquí)</p>
    </div>
);

// --- Contenido principal de la página del editor ---
const EditorPageContent = () => {
    const router = useRouter();
    const params = useParams();
    const id_evento = params.id as string;
    const id_campana = params.id_campana as string;

    const { query } = useEditor();
    const [activeTab, setActiveTab] = useState("landing");
    const emailEditorRef = useRef<any>(null);

    // Estados para ambos editores
    const [data, setData] = useState<CampanaData | null>(null);
    const [landingJson, setLandingJson] = useState<string | null>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    
    // Estados de carga y error
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Carga inicial de datos para ambos editores
    useEffect(() => {
        if (!id_campana) return;

        const fetchAndLoadCampaign = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiFetch(`/campanas/${id_campana}`);
                const result = await response.json();
                
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'No se pudo cargar la información de la campaña.');
                }
                
                const campanaData = result.data;
                const publicDataResponse = await apiFetch(`/public/campana/${campanaData.url_amigable}`);
                const publicData = await publicDataResponse.json();

                if(!publicData.success) throw new Error("No se pudo cargar la data pública");

                setData(publicData.data);
                
                const jsonString = campanaData.landing_page_json;
                if (jsonString && jsonString !== "null") {
                    setLandingJson(jsonString);
                }

                const eventName = publicData.data?.campana?.evento_nombre || 'el evento';

                if (campanaData.email_subject) {
                    setEmailSubject(campanaData.email_subject);
                } else {
                    setEmailSubject(`Confirmación de inscripción a ${eventName}`);
                }

                if (campanaData.email_body) {
                    setEmailBody(campanaData.email_body);
                } else {
                    setEmailBody(getDefaultEmailHtml(eventName));
                }
                
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAndLoadCampaign();
    }, [id_campana]);

    // Lógica de guardado
    const handleSave = async () => {
        if (activeTab === 'landing') {
            await handleSaveLanding();
        } else {
            await handleSaveEmail();
        }
    };

    const handleSaveLanding = async () => {
        const json = query.serialize();
        const toastId = toast.loading("Guardando landing page...");
        setSaving(true);
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
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!emailSubject.trim()) return toast.error('El asunto no puede estar vacío.');
        
        const currentEmailBody = emailEditorRef.current ? emailEditorRef.current.getContent() : emailBody;
        if (!currentEmailBody.trim()) return toast.error('El contenido no puede estar vacío.');

        const toastId = toast.loading("Guardando plantilla de correo...");
        setSaving(true);
        try {
            const response = await apiFetch(`/campanas/${id_campana}/template`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailSubject: emailSubject, emailBody: currentEmailBody }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "No se pudo guardar la plantilla.");
            toast.success("Plantilla de correo guardada con éxito", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    // Renderizado condicional de estados
    if (loading) return <div className="flex justify-center items-center h-screen"><p>Cargando editor...</p></div>;
    if (error) return <div className="flex flex-col justify-center items-center h-screen bg-red-50 text-red-700"><AlertTriangle className="h-16 w-16 mb-4" /><h1 className="text-2xl font-bold">Error al cargar el editor</h1><p>{error}</p><Button onClick={() => router.back()} className="mt-6">Volver</Button></div>;
    if (!data) return <div className="flex justify-center items-center h-screen"><p>No se encontraron datos para esta campaña.</p></div>;

    // Renderizado principal del componente
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
                <Button variant="outline" onClick={() => router.push(`/eventos/${id_evento}/campanas`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <h1 className="text-lg font-semibold truncate px-4">Editor: {data.campana.nombre}</h1>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" /> 
                    {saving ? 'Guardando...' : (activeTab === 'landing' ? 'Guardar Landing' : 'Guardar Correo')}
                </Button>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
                <div className="flex justify-center border-b bg-white">
                    <TabsList>
                        <TabsTrigger value="landing"><LayoutTemplate className="mr-2 h-4 w-4" /> Editor de Landing Page</TabsTrigger>
                        <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" /> Editor de Correo</TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="landing" className="flex-grow m-0">
                    <div className="flex-grow grid grid-cols-12 overflow-hidden h-full">
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
                </TabsContent>

                <TabsContent value="email" className="flex-grow overflow-y-auto p-4 m-0">
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <CardTitle>Diseñador de Correo de Confirmación</CardTitle>
                            <CardDescription>
                                Esta plantilla se enviará a los asistentes al confirmar su inscripción.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Asunto del Correo</Label>
                                <Input
                                    id="subject"
                                    placeholder="Ej: ¡Confirmamos tu inscripción a {{nombre_evento}}!"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contenido del Correo</Label>
                                <TinyEditor
                                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                                    onInit={(_evt, editor) => emailEditorRef.current = editor}
                                    initialValue={emailBody}
                                    init={{
                                        height: 500,
                                        menubar: true, // Habilitamos la barra de menú para acceso a más herramientas
                                        plugins: [
                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 
                                            'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 
                                            'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'
                                        ],
                                        // --- BARRA DE HERRAMIENTAS MODIFICADA ---
                                        toolbar: 'undo redo | blocks | ' +
                                            'bold italic forecolor | alignleft aligncenter ' +
                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                            'link image media | code | removeformat | help',
                                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Componente principal que envuelve con el proveedor de Craft.js
export default function EditorPage() {
    return (
        <CraftEditor
            resolver={{
                CraftContainer, CraftText, CraftColumns, CraftImage,
                CraftVideo, CraftButton, CraftSpacer
            }}>
            <EditorPageContent />
        </CraftEditor>
    );
}