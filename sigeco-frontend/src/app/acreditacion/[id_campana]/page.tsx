"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast, type Toast } from "react-hot-toast";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatCLPCurrency, parseMoneyLikeValue } from "@/lib/money";

import AcreditacionContainer from "./components/AcreditacionContainer";
import { Asistente, CampoFormulario, TipoCampo } from "./types";
import RegistrarEnPuertaDialog from "./components/RegistrarEnPuertaDialog";
import MainLayout from "@/components/Layout/MainLayout";

type CampanaInfo = {
  nombre: string;
  obligatorio_pago: boolean;
  id_evento?: number;
  [key: string]: any;
};

type FiltroEstado = "todos" | "acreditados" | "no_acreditados" | "pagados";

enum EstadoBackendAcreditacion {
  Asistio = "Asistió",
  Cancelado = "Cancelado",
  Confirmado = "Confirmado",
}

function deriveEstadoAcreditacion(asistente: any): "Pendiente" | "Acreditado" | "Denegado" {
  const explicit =
    asistente?.estado_acreditacion ??
    asistente?.acreditacion_estado ??
    asistente?.estadoAcreditacion ??
    null;

  if (typeof explicit === "string") {
    const normalized = explicit.toLowerCase().trim();
    if (["acreditado", "asistió", "asistio"].includes(normalized)) return "Acreditado";
    if (["denegado", "cancelado"].includes(normalized)) return "Denegado";
    if (["pendiente", "confirmado"].includes(normalized)) return "Pendiente";
  }

  const legacy = String(asistente?.estado_asistencia ?? "").trim().toLowerCase();

  if (legacy === "asistió" || legacy === "asistio") return "Acreditado";
  if (legacy === "cancelado") return "Denegado";

  return "Pendiente";
}

function deriveNivel(asistente: any): string {
  const explicit =
    asistente?.nivel ??
    asistente?.nivel_asistencia ??
    asistente?.estado_real ??
    asistente?.estado_inscripcion ??
    asistente?.status_nivel;

  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }

  const legacy = String(asistente?.estado_asistencia ?? "").trim();

  if (!legacy || legacy === "Asistió" || legacy === "Cancelado") {
    return "Sin nivel";
  }

  return legacy;
}

function deriveFechaCreacionContacto(asistente: any): string | null {
  const candidates = [
    asistente?.fecha_creacion_contacto,
    asistente?.contacto_fecha_creacion,
    asistente?.created_at_contacto,
    asistente?.contacto_created_at,
    asistente?.fecha_creacion,
    asistente?.created_at,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value;
  }

  return null;
}

function isPagadoValue(value: any): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();

  return [
    "pagado",
    "paid",
    "aprobado",
    "approved",
    "aceptado",
    "completed",
    "completado",
    "exitoso",
    "exitosa",
    "paid_out",
  ].includes(normalized);
}

function normalizeMoneyNumber(value: any): number {
  return parseMoneyLikeValue(value);
}

function formatCurrencyCLP(value: any): string {
  return formatCLPCurrency(value);
}

function deriveMontoPagadoActual(asistente: any): number {
  const fromBackend =
    asistente?.monto_pagado_actual ??
    asistente?.monto_pagado_manual ??
    null;

  if (fromBackend !== null && typeof fromBackend !== "undefined" && fromBackend !== "") {
    return normalizeMoneyNumber(fromBackend);
  }

  const montoPagoLegacy = asistente?.monto ?? 0;

  if (isPagadoValue(asistente?.estado_pago) || isPagadoValue(asistente?.estado_transaccion)) {
    return normalizeMoneyNumber(montoPagoLegacy);
  }

  return 0;
}

function normalizeAsistente(raw: any): Asistente {
  const montoPagadoActual = deriveMontoPagadoActual(raw);

  return {
    ...raw,
    nivel: deriveNivel(raw),
    estado_acreditacion: deriveEstadoAcreditacion(raw),
    fecha_creacion_contacto: deriveFechaCreacionContacto(raw),
    monto_pagado_actual: montoPagadoActual,
    monto_pagado_actual_formateado: formatCurrencyCLP(montoPagadoActual),
  };
}

export default function AcreditarCampanaPage() {
  const router = useRouter();
  const params = useParams();
  const id_campana = params.id_campana as string;

  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campanaInfo, setCampanaInfo] = useState<CampanaInfo | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [eventName, setEventName] = useState<string>("");

  const fetchPageData = useCallback(async () => {
    if (!id_campana) return;

    setLoading(true);

    try {
      const campanaRes = await apiFetch(`/campanas/${id_campana}`);
      const campanaResult = await campanaRes.json();

      if (!campanaResult.success) {
        throw new Error(campanaResult.error || "No se pudo cargar la info de la campaña.");
      }

      const infoCampana: CampanaInfo = campanaResult.data;
      setCampanaInfo(infoCampana);

      const fetches: Promise<Response>[] = [
        apiFetch(`/campanas/${id_campana}/asistentes-v2?limit=2000`),
        apiFetch(`/campanas/${id_campana}/formulario`),
      ];

      if (infoCampana.id_evento) {
        fetches.push(apiFetch(`/campanas/evento/${infoCampana.id_evento}`));
      }

      const [asistentesRes, formRes, eventRes] = await Promise.all(fetches);

      const asistentesData = await asistentesRes.json();

      let rawAsistentes: any[] = [];
      if (Array.isArray(asistentesData)) {
        rawAsistentes = asistentesData;
      } else if (Array.isArray(asistentesData?.data)) {
        rawAsistentes = asistentesData.data;
      } else if (Array.isArray(asistentesData?.asistentes)) {
        rawAsistentes = asistentesData.asistentes;
      }

      setAsistentes(rawAsistentes.map(normalizeAsistente));

      const formResult = await formRes.json();

      if (!formResult.success) {
        throw new Error("No se pudo cargar la configuración del formulario.");
      }

      let campos: CampoFormulario[] = formResult.data.map((c: any) => ({
        ...c,
        es_de_sistema: c.es_de_sistema,
        tipo_campo: c.tipo_campo as TipoCampo,
      }));

      const systemFields: CampoFormulario[] = [
        {
          id_campo: -1,
          nombre_interno: "nivel",
          etiqueta: "Nivel",
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: "TEXTO_CORTO",
          es_obligatorio: false,
          orden: -1000,
        },
        {
          id_campo: -2,
          nombre_interno: "estado_acreditacion",
          etiqueta: "Estado acreditación",
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: "TEXTO_CORTO",
          es_obligatorio: false,
          orden: -999,
        },
        {
          id_campo: -3,
          nombre_interno: "fecha_acreditacion",
          etiqueta: "Fecha acreditación",
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: "TEXTO_CORTO",
          es_obligatorio: false,
          orden: -998,
        },
        {
          id_campo: -4,
          nombre_interno: "fecha_creacion_contacto",
          etiqueta: "Fecha creación contacto",
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: "TEXTO_CORTO",
          es_obligatorio: false,
          orden: -997,
        },
      ];

      if (infoCampana.obligatorio_pago) {
        systemFields.push({
          id_campo: -5,
          nombre_interno: "estado_pago",
          etiqueta: "Estado pago",
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: "TEXTO_CORTO",
          es_obligatorio: false,
          orden: -996,
        });

        systemFields.push({
          id_campo: -6,
          nombre_interno: "monto_pagado_actual",
          etiqueta: "Monto pagado",
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: "TEXTO_CORTO",
          es_obligatorio: false,
          orden: -995,
        });
      }

      campos = [...systemFields, ...campos];
      setCamposFormulario(campos);

      if (eventRes) {
        const eventResult = await eventRes.json();
        if (eventResult.success) {
          setEventName(eventResult.data?.eventName || "");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los datos de la página.");
    } finally {
      setLoading(false);
    }
  }, [id_campana]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const filteredAsistentes = useMemo(() => {
    if (isModalOpen) return asistentes;

    let filtrados = [...asistentes];

    if (filtroEstado === "acreditados") {
      filtrados = filtrados.filter((a) => a.estado_acreditacion === "Acreditado");
    } else if (filtroEstado === "no_acreditados") {
      filtrados = filtrados.filter((a) => a.estado_acreditacion !== "Acreditado");
    } else if (filtroEstado === "pagados") {
      filtrados = filtrados.filter((a) => isPagadoValue((a as any).estado_pago));
    }

    return filtrados;
  }, [asistentes, isModalOpen, filtroEstado]);

  const handleUpdateStatus = async (
    id_inscripcion: number,
    nuevo_estado: "acreditado" | "denegado" | "pendiente"
  ) => {
    if (updatingId !== null) return;

    setUpdatingId(id_inscripcion);

    const originalAsistentes = [...asistentes];

    const estadoBackend = {
      acreditado: EstadoBackendAcreditacion.Asistio,
      denegado: EstadoBackendAcreditacion.Cancelado,
      pendiente: EstadoBackendAcreditacion.Confirmado,
    }[nuevo_estado];

    const estadoAcreditacionUI = {
      acreditado: "Acreditado",
      denegado: "Denegado",
      pendiente: "Pendiente",
    }[nuevo_estado] as "Acreditado" | "Denegado" | "Pendiente";

    setAsistentes((prev) =>
      prev.map((a) =>
        a.id_inscripcion === id_inscripcion
          ? {
              ...a,
              estado_acreditacion: estadoAcreditacionUI,
              fecha_acreditacion:
                nuevo_estado === "acreditado"
                  ? new Date().toISOString()
                  : nuevo_estado === "pendiente"
                  ? null
                  : a.fecha_acreditacion,
            }
          : a
      )
    );

    const toastId = toast.loading("Actualizando...");

    try {
      const response = await apiFetch(`/acreditacion/inscripcion/${id_inscripcion}/estado`, {
        method: "PUT",
        body: JSON.stringify({ nuevo_estado: estadoBackend }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "No se pudo actualizar el estado.");
      }

      if (nuevo_estado === "acreditado") {
        toast.dismiss(toastId);

        const asistente = originalAsistentes.find((a) => a.id_inscripcion === id_inscripcion);
        const nombre =
          (asistente as any)?.nombre ||
          (asistente as any)?.Nombre ||
          (asistente as any)?.NOMBRE ||
          "";

        toast.custom(
          (t: Toast) => (
            <div className="pointer-events-auto w-full max-w-2xl">
              <div className="rounded-2xl overflow-hidden border border-yellow-300 bg-white shadow-2xl">
                <div className="bg-gray-200 px-6 py-6 text-center">
                  <p className="text-5xl font-extrabold tracking-wide text-yellow-400">
                    ACREDITADO
                  </p>
                </div>

                <div className="h-3 bg-yellow-300" />

                <div className="p-4 text-center">
                  <p className="text-base text-gray-700">
                    {nombre ? (
                      <>
                        <span className="font-semibold">{nombre}</span> acreditado correctamente.
                      </>
                    ) : (
                      <>Asistente acreditado correctamente.</>
                    )}
                  </p>

                  <button
                    type="button"
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ),
          { duration: 1200 }
        );
      } else {
        toast.success("Estado actualizado", { id: toastId });
      }
    } catch (error: any) {
      setAsistentes(originalAsistentes);
      toast.error(error.message || "No se pudo actualizar.", { id: toastId });
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const list = Array.isArray(asistentes) ? asistentes : [];
    const total = list.length;
    const acreditados = list.filter((a) => a.estado_acreditacion === "Acreditado").length;
    const pendientes = total - acreditados;
    const pagados = list.filter((a) => isPagadoValue((a as any).estado_pago)).length;
    const totalRecaudado = list.reduce(
      (acc, a) => acc + normalizeMoneyNumber((a as any).monto_pagado_actual),
      0
    );

    return { total, acreditados, pendientes, pagados, totalRecaudado };
  }, [asistentes]);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.push("/eventos/gestion")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
          </Button>

          <div className="flex flex-col items-center justify-center text-center flex-1 min-w-0 px-4">
            <h1
              className="text-2xl font-bold truncate w-full"
              title={loading ? "Cargando..." : `ACREDITACIÓN ${eventName}`}
            >
              {loading ? "Cargando..." : `ACREDITACIÓN ${eventName || "Evento"}`}
            </h1>

            {campanaInfo && (
              <p
                className="text-lg text-gray-600 font-medium truncate w-full"
                title={campanaInfo.nombre}
              >
                Campaña: {campanaInfo.nombre}
              </p>
            )}
          </div>

          <div style={{ width: "150px" }} className="flex-shrink-0" />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Panel de Control</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-md border px-3 py-2 text-sm font-medium">
                Total: <span className="font-bold">{stats.total}</span>
              </div>

              <div className="rounded-md border px-3 py-2 text-sm font-medium text-green-700">
                Acreditados: <span className="font-bold">{stats.acreditados}</span>
              </div>

              <div className="rounded-md border px-3 py-2 text-sm font-medium text-gray-700">
                Pendientes: <span className="font-bold">{stats.pendientes}</span>
              </div>

              {campanaInfo?.obligatorio_pago && (
                <div className="rounded-md border px-3 py-2 text-sm font-medium text-emerald-700">
                  Pagados: <span className="font-bold">{stats.pagados}</span>
                </div>
              )}
            </div>

            <div className="flex w-full gap-2 lg:w-auto">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full lg:w-auto"
                disabled={!campanaInfo}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar en Puerta
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-10">Cargando asistentes...</div>
        ) : (
          <AcreditacionContainer
            asistentes={filteredAsistentes}
            camposFormulario={camposFormulario}
            onUpdateStatus={handleUpdateStatus}
            updatingId={updatingId}
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
            externalSearchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />
        )}
      </div>

      <RegistrarEnPuertaDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formConfig={camposFormulario.filter(
          (c) =>
            ![
              "nivel",
              "estado_acreditacion",
              "fecha_acreditacion",
              "fecha_creacion_contacto",
              "estado_pago",
              "monto_pagado_actual",
            ].includes(c.nombre_interno)
        )}
        isSubmitting={false}
        id_campana={id_campana}
        onSubmit={async (payload) => {
          try {
            const toastId = toast.loading("Registrando asistente...");

            const response = await apiFetch(`/acreditacion/registrar-en-puerta/${id_campana}`, {
              method: "POST",
              body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.success) {
              throw new Error(result.error || "No se pudo registrar el asistente.");
            }

            toast.success("Asistente registrado con éxito!", { id: toastId });

            const emailRegistrado =
              payload?.contacto?.email ||
              payload?.inscripcion?.email ||
              payload?.email ||
              "";

            setFiltroEstado("todos");
            setSearchTerm(emailRegistrado);
            setIsModalOpen(false);
            await fetchPageData();
          } catch (error: any) {
            toast.error(error.message || "No se pudo registrar.");
          }
        }}
      />
    </MainLayout>
  );
}