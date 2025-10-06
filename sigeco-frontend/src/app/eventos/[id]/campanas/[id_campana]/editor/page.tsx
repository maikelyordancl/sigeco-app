"use client";

import { useState, useEffect, useRef } from "react";
import { Editor as TinyEditor } from "@tinymce/tinymce-react";
import { Editor as CraftEditor, Frame, Element, useEditor } from "@craftjs/core";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Mail, LayoutTemplate, Palette, PlusCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CampanaData } from "@/app/c/[slug]/types";

const availableVariables = [
  { name: "Nombre del Asistente", value: "{{nombre_asistente}}" },
  { name: "Email del Asistente", value: "{{email_asistente}}" },
  { name: "Nombre del Evento", value: "{{nombre_evento}}" },
  { name: "Fecha del Evento", value: "{{fecha_evento}}" },
  { name: "Lugar del Evento", value: "{{lugar_evento}}" },
];

interface EmailSettings {
  headerColor: string;
}

/* ===================== Helpers (solo header) ===================== */
const normalizeHex = (v: string) => (v?.trim().startsWith("#") ? v.trim() : `#${v?.trim()}`);
const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v || "");

/** Pinta SOLO el header (id=email-header-preview o fallback primer h1/h2 + span) */
const applyPrimaryColorToHtml = (html: string, hex: string) => {
  const color = normalizeHex(hex);
  if (!isHex(color) || !html) return html;
  let out = html;

  // 1) Si existe un contenedor con id=email-header-preview
  out = out.replace(
    /(<div[^>]*id=["']email-header-preview["'][^>]*style=")([^"]*)(")/i,
    (_m, p1, style, p3) => {
      const cleaned = style.replace(/background(?:-color|-image)?\s*:\s*[^;"]*;?/gi, "").trim();
      const newStyle = `background:${color};background-color:${color};background-image:none;${cleaned ? cleaned + ";" : ""}`;
      return `${p1}${newStyle}${p3}`;
    }
  );
  out = out.replace(
    /(<div[^>]*id=["']email-header-preview["'](?![^>]*style=)[^>]*)(>)/i,
    (_m, p1, p2) => `${p1} style="background:${color};background-color:${color};background-image:none"${p2}`
  );

  // Si ya pintamos el header con id, salimos.
  if (/id=["']email-header-preview["'][^>]*style="[^"]*background/i.test(out)) return out;

  // 2) Fallback: primer bloque <h1>/<h2> (y spans internos) con background
  const headerBlockMatch = out.match(/<h[12][^>]*>[\s\S]*?<\/h[12]>/i);
  if (headerBlockMatch) {
    const original = headerBlockMatch[0];
    let modified = original;

    // spans internos con fondo
    modified = modified.replace(
      /(<span[^>]*style=")([^"]*)(")/gi,
      (_m, p1, style, p3) => {
        const newStyle = style.replace(/background(?:-color|-image)?\s*:\s*[^;"]*;?/gi, "").trim();
        const withBg = `background:${color};background-color:${color};background-image:none;${newStyle ? newStyle + ";" : ""}`;
        return `${p1}${withBg}${p3}`;
      }
    );

    // el propio h1/h2 si tiene fondo
    modified = modified.replace(
      /(<h[12][^>]*style=")([^"]*)(")/i,
      (_m, p1, style, p3) => {
        const cleaned = style.replace(/background(?:-color|-image)?\s*:\s*[^;"]*;?/gi, "").trim();
        const newStyle = `background:${color};background-color:${color};background-image:none;${cleaned ? cleaned + ";" : ""}`;
        return `${p1}${newStyle}${p3}`;
      }
    );

    out = out.replace(original, modified);
  }

  return out;
};

/** Detecta el color actual del header desde el HTML (id, h1/h2 o span) */
const extractHeaderColor = (html: string): string | null => {
  if (!html) return null;
  const m =
    html.match(/id=["']email-header-preview["'][^>]*style="[^"]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i) ||
    html.match(/<h[12][^>]*style="[^"]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i) ||
    html.match(/<span[^>]*style="[^"]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i);
  return m ? normalizeHex(m[1]) : null;
};
/* =============================================================== */

const getDefaultEmailHtml = (eventName: string, settings: EmailSettings) => {
  return `
  <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Confirmación Inscripción ${eventName}</title></head>
    <body style="margin:0; padding:0; background-color:#f0f0f0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width:600px; margin:20px auto; background:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.1); border-radius:8px; overflow:hidden;">
        <div id="email-header-preview" style="padding:20px; background-color:${settings.headerColor}; text-align:center;">
          <h2 style="margin:0; padding:0; color:#ffffff; font-size: 24px;">¡Inscripción Confirmada!</h2>
        </div>
        <div style="padding:20px; font-size:16px; line-height:1.6; color:#333;">
          <p>Hola {{nombre_asistente}},</p>
          <p>¡Excelente! Tu inscripción para el <strong>${eventName}</strong>, ha sido confirmada exitosamente.</p>
          <p><strong style="color:#008c23;">Fecha del evento:</strong> {{fecha_evento}}.</p>
          <p><strong style="color:#008c23;">Lugar:</strong> {{lugar_evento}}.</p>
          <p><strong style="color:#008c23;">Para ingresar:</strong> Presenta tu carnet de identidad en la entrada.</p>
          <p>Saludos cordiales,</p><p><strong>Equipo Organizador</strong></p>
        </div>
        <div style="border-top:1px solid #DFE3E8; padding:15px; text-align:center; font-size:12px; color:#888;">
          <p>Este es un correo automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const EditorPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const id_evento = params.id as string;
  const id_campana = params.id_campana as string;
  const { query } = useEditor();
  const [activeTab, setActiveTab] = useState("landing");
  const emailEditorRef = useRef<any>(null);
  const [data, setData] = useState<CampanaData | null>(null);
  const [landingJson, setLandingJson] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({ headerColor: "#4cd964" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cambiar color (solo header)
  const handlePrimaryColorChange = (value: string) => {
    const color = normalizeHex(value);
    setEmailSettings((s) => ({ ...s, headerColor: color }));
    const ed = emailEditorRef.current;
    if (!ed || !isHex(color)) return;
    const currentHtml = ed.getContent({ format: "html" }) as string;
    const updatedHtml = applyPrimaryColorToHtml(currentHtml, color);
    if (updatedHtml !== currentHtml) {
      ed.undoManager?.transact?.(() => ed.setContent(updatedHtml));
    }
  };

  useEffect(() => {
    if (!id_campana) return;
    const fetchAndLoadCampaign = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/campanas/${id_campana}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "No se pudo cargar la información de la campaña.");
        }
        const campanaData = result.data;

        const publicDataResponse = await apiFetch(`/public/campana/${campanaData.url_amigable}`);
        const publicData = await publicDataResponse.json();
        if (!publicData.success) throw new Error("No se pudo cargar la data pública");

        setData(publicData.data);
        const jsonString = campanaData.landing_page_json;
        if (jsonString && jsonString !== "null") setLandingJson(jsonString);

        const eventName = publicData.data?.campana?.evento_nombre || "el evento";
        setEmailSubject(campanaData.email_subject || `Confirmación de inscripción a ${eventName}`);

        // 1) color desde settings (si es válido)
        let colorFromSettings: string | null = null;
        if (campanaData.email_settings) {
          try {
            const parsed =
              typeof campanaData.email_settings === "string"
                ? JSON.parse(campanaData.email_settings)
                : campanaData.email_settings;
            if (parsed && typeof parsed === "object" && parsed.headerColor && isHex(parsed.headerColor)) {
              colorFromSettings = normalizeHex(parsed.headerColor);
            }
          } catch {
            /* ignore parse errors */
          }
        }

        // 2) color detectado desde el HTML guardado
        const htmlFromDb: string | null = campanaData.email_body || null;
        const colorFromHtml = htmlFromDb ? extractHeaderColor(htmlFromDb) : null;

        // 3) color final
        const resolvedColor = colorFromSettings || colorFromHtml || "#4cd964";
        setEmailSettings({ headerColor: resolvedColor });

        // HTML efectivo
        if (htmlFromDb) {
          setEmailBody(htmlFromDb);
        } else {
          setEmailBody(getDefaultEmailHtml(eventName, { headerColor: resolvedColor }));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAndLoadCampaign();
  }, [id_campana]);

  // Pintar SOLO el header cuando llega HTML o cambia el color
  useEffect(() => {
    const ed = emailEditorRef.current;
    if (!ed) return;
    const color = emailSettings.headerColor;
    const html = emailBody || "";
    const painted = isHex(color) ? applyPrimaryColorToHtml(html, color) : html;
    ed.setContent(painted);
  }, [emailBody, emailSettings.headerColor]);

  const handleSave = async () => {
    if (activeTab === "landing") await handleSaveLanding();
    else await handleSaveEmail();
  };

  const handleSaveLanding = async () => {
    try {
      setSaving(true);
      const serialized = query.serialize();
      const resp = await apiFetch(`/campanas/${id_campana}/landing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landing_page_json: serialized }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || "No se pudo guardar la landing.");
      toast.success("Landing guardada correctamente.");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar la landing.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      setSaving(true);
      const editor = emailEditorRef.current;
      if (!editor) throw new Error("Editor de correo no disponible.");

      // Guardar con header ya pintado
      const currentHtml = editor.getContent({ format: "html" }) as string;
      const bodyHtml = isHex(emailSettings.headerColor)
        ? applyPrimaryColorToHtml(currentHtml, emailSettings.headerColor)
        : currentHtml;

      const payload = {
        emailSubject: emailSubject,
        emailBody: bodyHtml,
        emailSettings: { headerColor: normalizeHex(emailSettings.headerColor) },
      };

      const resp = await apiFetch(`/campanas/${id_campana}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.message || "No se pudo guardar el correo.");

      toast.success(data?.message || "Correo guardado correctamente.");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar el correo.");
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const editor = emailEditorRef.current;
    if (!editor) return;
    editor.focus();
    editor.insertContent(variable);
  };

  if (loading) return <div>Cargando editor...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No se encontraron datos.</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
        <Button variant="outline" onClick={() => router.push(`/eventos/${id_evento}/campanas`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-lg font-semibold truncate px-4">Editor: {data.campana.nombre}</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Guardando..." : activeTab === "landing" ? "Guardar Landing" : "Guardar Correo"}
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <div className="flex justify-center border-b bg-white">
          <TabsList>
            <TabsTrigger value="landing">
              <LayoutTemplate className="mr-2 h-4 w-4" /> Editor de Landing Page
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" /> Editor de Correo
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="landing" className="flex-grow m-0">
          <div className="flex-grow grid grid-cols-12 overflow-hidden h-full">
            <aside className="col-span-2 bg-white p-2 border-r overflow-y-auto">
              <Toolbox />
            </aside>
            <main className="col-span-7 bg-gray-200 overflow-auto">
              <Frame json={landingJson ?? undefined}>
                <Element is={CraftContainer} canvas id="main-content" className="min-h-full" />
              </Frame>
            </main>
            <aside className="col-span-3 bg-white p-2 border-l overflow-y-auto">
              <SettingsPanel />
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="email" className="flex-grow overflow-y-auto p-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="md:col-span-1 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Diseño del Correo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headerColor">
                      <Palette className="inline-block mr-2 h-4 w-4" />
                      Color Principal
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="headerColor"
                        type="color"
                        className="p-1 h-10 w-14"
                        value={emailSettings.headerColor}
                        onChange={(e) => handlePrimaryColorChange(e.target.value)}
                      />
                      <Input
                        type="text"
                        className="flex-1"
                        value={emailSettings.headerColor}
                        onChange={(e) => handlePrimaryColorChange(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Variables Disponibles</CardTitle>
                  <CardDescription>Clic para insertar en el texto.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable.value}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.value)}
                      className="flex items-center"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {variable.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Diseñador de Correo de Confirmación</CardTitle>
                  <CardDescription>Esta plantilla se enviará a los asistentes al confirmar su inscripción.</CardDescription>
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
                      onInit={(_evt, editor) => {
                        emailEditorRef.current = editor;
                        const color = emailSettings.headerColor;
                        const html = emailBody || "";
                        const painted = isHex(color) ? applyPrimaryColorToHtml(html, color) : html;
                        editor.setContent(painted);
                      }}
                      initialValue={emailBody}
                      init={{
                        language: "es",
                        height: 1000,
                        menubar: true,
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "help",
                          "wordcount",
                        ],
                        toolbar:
                          "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | code | removeformat | help",
                        content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function EditorPage() {
  return (
    <CraftEditor
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
      <EditorPageContent />
    </CraftEditor>
  );
}
