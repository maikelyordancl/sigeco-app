"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Copy, ExternalLink, Ticket } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api";

type EstadoPago =
  | "No Aplica"
  | "Pendiente"
  | "Pagado"
  | "Rechazado"
  | "Reembolsado";

type MedioPagoOpcion =
  | "Efectivo"
  | "Transferencia"
  | "Flow"
  | "Cortesia"
  | "Otro";

type ColumnKey =
  | "id"
  | "nombre"
  | "email"
  | "empresa"
  | "entrada"
  | "montoTotal"
  | "pagado"
  | "saldo"
  | "medio"
  | "estado"
  | "gestion"
  | "fecha";

interface AsistenteTesoreria {
  id_inscripcion: number;
  id_tipo_entrada: number | null;
  nombre: string;
  email: string;
  empresa: string | null;
  rut: string | null;
  tipo_entrada: string | null;
  monto_total: number | string | null;
  monto_ref: number | string | null;
  monto_objetivo_manual: number | string | null;
  monto_pagado_actual: number | string | null;
  saldo_pendiente: number | string | null;
  monto_pagado_manual: number | string | null;
  ultimo_medio_pago: string | null;
  estado_transaccion: string | null;
  estado_pago: EstadoPago;
  fecha_inscripcion: string;
  nota: string | null;
}

interface HistorialPago {
  id_movimiento: number;
  id_pago: number | null;
  monto: number | string;
  medio_pago: string;
  tipo_registro: string;
  estado: string;
  observacion: string | null;
  fecha_pago: string | null;
  fecha_creado: string;
  orden_compra: string | null;
}

interface CampanaInfo {
  id_campana: number;
  nombre: string;
  obligatorio_pago: boolean;
}

interface TicketInfo {
  id_tipo_entrada: number;
  nombre: string;
  precio: number;
}

interface PaymentDraft {
  monto: string;
  monto_objetivo_manual: string;
  id_tipo_entrada: string; // <-- NUEVO: Para almacenar el ticket seleccionado
  medio_pago: MedioPagoOpcion;
  nota: string;
  generated_link: string | null;
}

type VisibleColumnsState = Record<ColumnKey, boolean>;
type DraftsState = Record<number, PaymentDraft>;

const DEFAULT_VISIBLE_COLUMNS: VisibleColumnsState = {
  id: true,
  nombre: true,
  email: true,
  empresa: false,
  entrada: true,
  montoTotal: true,
  pagado: true,
  saldo: true,
  medio: true,
  estado: true,
  gestion: true,
  fecha: true,
};

const COLUMN_OPTIONS: Array<{ key: ColumnKey; label: string }> = [
  { key: "id", label: "ID" },
  { key: "nombre", label: "Nombre" },
  { key: "email", label: "Email" },
  { key: "empresa", label: "Empresa" },
  { key: "entrada", label: "Detalle compra" },
  { key: "montoTotal", label: "Valor compra" },
  { key: "pagado", label: "Total pagado" },
  { key: "saldo", label: "Saldo pendiente" },
  { key: "medio", label: "Medio de pago" },
  { key: "estado", label: "Estado" },
  { key: "gestion", label: "Gestión" },
  { key: "fecha", label: "Fecha" },
];

const MEDIOS_PAGO_DISPONIBLES: MedioPagoOpcion[] = [
  "Efectivo",
  "Transferencia",
  "Flow",
  "Cortesia",
  "Otro",
];

const MANUAL_PAYMENT_OPTIONS: MedioPagoOpcion[] = [
  "Efectivo",
  "Transferencia",
  "Cortesia",
  "Otro",
];

const getEmptyDraft = (): PaymentDraft => ({
  monto: "",
  monto_objetivo_manual: "0",
  id_tipo_entrada: "", // <-- NUEVO
  medio_pago: "Efectivo",
  nota: "",
  generated_link: null,
});

export default function TesoreriaCampanaPage() {
  const router = useRouter();
  const params = useParams();
  const id_campana = params.id_campana as string;

  const [campana, setCampana] = useState<CampanaInfo | null>(null);
  const [tickets, setTickets] = useState<TicketInfo[]>([]); // <-- NUEVO ESTADO PARA TICKETS
  const [rows, setRows] = useState<AsistenteTesoreria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Record<number, HistorialPago[]>>({});
  const [drafts, setDrafts] = useState<DraftsState>({});
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumnsState>(
    DEFAULT_VISIBLE_COLUMNS
  );
  const [activeGestionId, setActiveGestionId] = useState<number | null>(null);

  const columnsStorageKey = `tesoreria-columns-${id_campana}`;

  const toNumber = (value: number | string | null | undefined) => {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
  };

  const formatMoney = (value: number | string | null | undefined) => {
    const num = toNumber(value);
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("es-CL");
  };

  const normalizeNote = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const getBadgeClasses = (estado: EstadoPago) => {
    switch (estado) {
      case "Pagado":
        return "bg-green-100 text-green-800";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "Rechazado":
        return "bg-red-100 text-red-800";
      case "Reembolsado":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTransactionBadgeClasses = (estado: string | null) => {
    switch (estado) {
      case "Pagado":
        return "bg-green-50 text-green-700 border-green-200";
      case "Pendiente":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Rechazado":
      case "Anulado":
        return "bg-red-50 text-red-700 border-red-200";
      case "Reembolsado":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const fetchAsistentes = useCallback(async () => {
    const response = await apiFetch(`/campanas/tesoreria/${id_campana}/asistentes`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "No se pudieron cargar los inscritos.");
    }

    const data = Array.isArray(result.data) ? result.data : [];
    setRows(data);

    setDrafts((prev) => {
      const next = { ...prev };
      for (const row of data) {
        // Inicializamos el draft con el ticket actual y el monto actual de la BD
        const montoBase = toNumber(row.monto_objetivo_manual) > 0 
                          ? toNumber(row.monto_objetivo_manual) 
                          : toNumber(row.monto_total);

        next[row.id_inscripcion] = {
          ...getEmptyDraft(),
          ...(next[row.id_inscripcion] || {}),
          id_tipo_entrada: row.id_tipo_entrada ? String(row.id_tipo_entrada) : "",
          monto_objetivo_manual: next[row.id_inscripcion]?.monto_objetivo_manual || String(montoBase),
        };
      }
      return next;
    });

    return data;
  }, [id_campana]);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);

      // Cargamos Campaña, Asistentes y Tickets en paralelo
      const [campanaRes, ticketsRes] = await Promise.all([
        apiFetch(`/campanas/${id_campana}`),
        apiFetch(`/tickets/campana/${id_campana}`).catch(() => null) // <--- ESTA ES LA RUTA CORRECTA
      ]);

      const campanaJson = await campanaRes.json();
      if (!campanaRes.ok || !campanaJson.success) {
        throw new Error(campanaJson.error || "No se pudo cargar la campaña.");
      }
      setCampana(campanaJson.data);

      if (ticketsRes && ticketsRes.ok) {
        const ticketsJson = await ticketsRes.json();
        if (ticketsJson.success) {
            setTickets(ticketsJson.data || []);
        }
      }

      await fetchAsistentes();
    } catch (error: any) {
      toast.error(error.message || "Error al cargar Tesorería.");
    } finally {
      setLoading(false);
    }
  }, [fetchAsistentes, id_campana]);

  const fetchHistorial = useCallback(async (id_inscripcion: number) => {
    const response = await apiFetch(
      `/campanas/tesoreria/inscripciones/${id_inscripcion}/historial-pagos`
    );
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "No se pudo cargar el historial.");
    }

    const data = Array.isArray(result.data) ? result.data : [];

    setHistorial((prev) => ({
      ...prev,
      [id_inscripcion]: data,
    }));

    return data;
  }, []);

  useEffect(() => {
    if (id_campana) {
      fetchPage();
    }
  }, [id_campana, fetchPage]);

  useEffect(() => {
    if (!id_campana) return;

    try {
      const raw = localStorage.getItem(columnsStorageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setVisibleColumns((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch {
      // Sin acción
    }
  }, [columnsStorageKey, id_campana]);

  useEffect(() => {
    if (!id_campana) return;

    try {
      localStorage.setItem(columnsStorageKey, JSON.stringify(visibleColumns));
    } catch {
      // Sin acción
    }
  }, [columnsStorageKey, id_campana, visibleColumns]);

  const visibles = useMemo(() => {
    let data = [...rows];

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      data = data.filter((r) => {
        return [
          r.nombre,
          r.email,
          r.empresa || "",
          r.rut || "",
          String(r.id_inscripcion),
          r.tipo_entrada || "",
          r.ultimo_medio_pago || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
    }

    return data;
  }, [rows, searchTerm]);

  const resumen = useMemo(() => {
    const totalRecaudado = rows.reduce(
      (acc, row) => acc + toNumber(row.monto_pagado_actual),
      0
    );

    const totalPorCobrar = rows.reduce(
      (acc, row) => acc + toNumber(row.saldo_pendiente),
      0
    );

    return {
      total: rows.length,
      conSaldoPendiente: rows.filter((r) => toNumber(r.saldo_pendiente) > 0).length,
      pagados: rows.filter((r) => r.estado_pago === "Pagado").length,
      totalRecaudado,
      totalPorCobrar,
    };
  }, [rows]);

  const activeColumnCount = useMemo(() => {
    return COLUMN_OPTIONS.filter((col) => visibleColumns[col.key]).length;
  }, [visibleColumns]);

  const selectedRow = useMemo(() => {
    if (!activeGestionId) return null;
    return rows.find((row) => row.id_inscripcion === activeGestionId) || null;
  }, [activeGestionId, rows]);

  const selectedDraft = useMemo(() => {
    return selectedRow ? drafts[selectedRow.id_inscripcion] || getEmptyDraft() : getEmptyDraft();
  }, [drafts, selectedRow]);

  const selectedHistorial = useMemo(() => {
    if (!selectedRow) return [];
    return historial[selectedRow.id_inscripcion] || [];
  }, [historial, selectedRow]);

  const isBusy = (key: string) => savingKey === key;

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateDraft = (
    id_inscripcion: number,
    field: keyof PaymentDraft,
    value: string | null
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id_inscripcion]: {
        ...(prev[id_inscripcion] || getEmptyDraft()),
        [field]: value,
      },
    }));
  };

  const resetDraftAfterManual = (id_inscripcion: number) => {
    setDrafts((prev) => ({
      ...prev,
      [id_inscripcion]: {
        ...(prev[id_inscripcion] || getEmptyDraft()),
        monto: "",
        nota: "",
        generated_link: null,
      },
    }));
  };

  const setGeneratedLink = (id_inscripcion: number, redirectUrl: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id_inscripcion]: {
        ...(prev[id_inscripcion] || getEmptyDraft()),
        generated_link: redirectUrl,
      },
    }));
  };

  const getDraft = (id_inscripcion: number) => {
    return drafts[id_inscripcion] || getEmptyDraft();
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("No se pudo copiar al portapapeles.");
    }
  };

  const openGestion = async (row: AsistenteTesoreria) => {
    setActiveGestionId(row.id_inscripcion);

    if (historial[row.id_inscripcion]) {
      return;
    }

    const key = `history-${row.id_inscripcion}`;

    try {
      setSavingKey(key);
      await fetchHistorial(row.id_inscripcion);
    } catch (error: any) {
      toast.error(error.message || "No se pudo cargar el historial.");
    } finally {
      setSavingKey(null);
    }
  };

  const handleGuardarMontoObjetivo = async (row: AsistenteTesoreria) => {
    const draft = getDraft(row.id_inscripcion);
    const monto = Number(draft.monto_objetivo_manual);
    const idTicket = draft.id_tipo_entrada ? Number(draft.id_tipo_entrada) : null;

    if (!Number.isFinite(monto) || monto < 0) {
      toast.error("Escribe un monto manual válido mayor o igual a 0.");
      return;
    }

    const key = `objective-${row.id_inscripcion}`;
    const toastId = toast.loading("Guardando configuración...");

    try {
      setSavingKey(key);

      const response = await apiFetch(
        `/campanas/tesoreria/inscripciones/${row.id_inscripcion}/monto-objetivo-manual`,
        {
          method: "PUT",
          body: JSON.stringify({ 
            monto_objetivo_manual: monto,
            id_tipo_entrada: idTicket // Mandamos el ticket seleccionado también
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "No se pudo guardar la configuración.");
      }

      await fetchAsistentes();
      await fetchHistorial(row.id_inscripcion);

      toast.success(
        monto === 0 && !idTicket
          ? "Configuración guardada. La inscripción quedó como cortesía/sin cobro."
          : "Configuración y monto guardados correctamente.",
        { id: toastId }
      );
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el monto.", {
        id: toastId,
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleRegistrarAbono = async (row: AsistenteTesoreria) => {
    const draft = getDraft(row.id_inscripcion);
    const monto = Number(draft.monto);

    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("Escribe un monto válido para registrar el abono.");
      return;
    }

    if (!MANUAL_PAYMENT_OPTIONS.includes(draft.medio_pago)) {
      toast.error("Selecciona un medio de pago manual válido.");
      return;
    }

    const key = `payment-${row.id_inscripcion}`;
    const toastId = toast.loading("Registrando pago...");

    try {
      setSavingKey(key);

      const response = await apiFetch(
        `/campanas/tesoreria/inscripciones/${row.id_inscripcion}/abonos`,
        {
          method: "POST",
          body: JSON.stringify({
            monto,
            medio_pago: draft.medio_pago,
            observacion: normalizeNote(draft.nota),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "No se pudo registrar el pago.");
      }

      resetDraftAfterManual(row.id_inscripcion);
      await fetchAsistentes();
      await fetchHistorial(row.id_inscripcion);

      toast.success("Pago registrado correctamente.", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el pago.", { id: toastId });
    } finally {
      setSavingKey(null);
    }
  };

  const handleGenerarLinkFlow = async (row: AsistenteTesoreria) => {
    const draft = getDraft(row.id_inscripcion);
    const monto = draft.monto.trim() === "" ? null : Number(draft.monto);

    if (monto !== null && (!Number.isFinite(monto) || monto <= 0)) {
      toast.error("El monto para Flow debe ser mayor a 0.");
      return;
    }

    const key = `payment-${row.id_inscripcion}`;
    const toastId = toast.loading("Generando link de pago...");

    try {
      setSavingKey(key);

      const response = await apiFetch(
        `/campanas/tesoreria/inscripciones/${row.id_inscripcion}/generar-link-flow`,
        {
          method: "POST",
          body: JSON.stringify({
            monto,
            observacion: normalizeNote(draft.nota),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "No se pudo generar el link.");
      }

      const redirectUrl = result?.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error("Flow no devolvió un link de pago.");
      }

      setGeneratedLink(row.id_inscripcion, redirectUrl);
      await fetchAsistentes();
      await fetchHistorial(row.id_inscripcion);

      toast.success("Link de pago generado. Ya puedes copiarlo o abrirlo.", {
        id: toastId,
      });
    } catch (error: any) {
      toast.error(error.message || "Error al generar el link.", { id: toastId });
    } finally {
      setSavingKey(null);
    }
  };

  const handleProcesarPago = async (row: AsistenteTesoreria) => {
    const montoTotal = toNumber(row.monto_total);

    if (montoTotal <= 0) {
      toast.error(
        "Primero define un Ticket o un monto manual a cobrar. Usa 0 solo si será una cortesía sin pago."
      );
      return;
    }

    const draft = getDraft(row.id_inscripcion);

    if (draft.medio_pago === "Flow") {
      await handleGenerarLinkFlow(row);
      return;
    }

    await handleRegistrarAbono(row);
  };

  if (loading) {
    return (
      <MainLayout title="Tesorería">
        <div className="text-center p-10">Cargando campaña...</div>
      </MainLayout>
    );
  }

  const selectedMontoTotal = selectedRow ? toNumber(selectedRow.monto_total) : 0;
  const selectedSaldoPendiente = selectedRow ? toNumber(selectedRow.saldo_pendiente) : 0;
  const selectedTieneTicket = Boolean(selectedRow?.id_tipo_entrada);
  const selectedFullyPaid =
    Boolean(selectedRow) && selectedMontoTotal > 0 && selectedSaldoPendiente <= 0;
  const selectedWithoutCharge =
    Boolean(selectedRow) && selectedMontoTotal <= 0 && toNumber(selectedRow?.monto_pagado_actual) <= 0;
  const selectedIsProcessing = selectedRow
    ? isBusy(`payment-${selectedRow.id_inscripcion}`)
    : false;
  const selectedIsHistoryLoading = selectedRow
    ? isBusy(`history-${selectedRow.id_inscripcion}`)
    : false;
  const selectedIsSavingObjective = selectedRow
    ? isBusy(`objective-${selectedRow.id_inscripcion}`)
    : false;
  const selectedIsFlow = selectedDraft.medio_pago === "Flow";

  // CLASES DE COLORES EXACTAS
  const tableHeadClass = "whitespace-nowrap border-r border-blue-500 bg-blue-600 px-3 py-3 text-white font-semibold last:border-r-0";
  const tableHeadCyanClass = "whitespace-nowrap border-r border-cyan-400 bg-cyan-400 px-3 py-3 text-cyan-950 font-bold last:border-r-0";
  const tableCellClass = "border-r border-slate-200 px-3 py-3 align-top last:border-r-0";
  const tableCellCyanClass = "border-r border-cyan-300 bg-cyan-100 px-3 py-3 align-top last:border-r-0 font-bold text-cyan-900";

  return (
    <MainLayout title="Tesorería">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Tesorería</h1>
            <p className="text-gray-500">{campana?.nombre || `Campaña #${id_campana}`}</p>
            <p className="text-sm text-gray-500 mt-1">
              Gestión de pagos manuales, abonos, asignación de tickets y links de cobro.
            </p>
          </div>

          <Button variant="outline" onClick={() => router.push("/tesoreria")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total inscritos</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{resumen.total}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Con saldo pendiente</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{resumen.conSaldoPendiente}</CardContent>
          </Card>

          {/* Tarjeta de Total Pagado Destacada en Cian */}
          <Card className="bg-cyan-100 border-cyan-300 border-2">
            <CardHeader>
              <CardTitle className="text-cyan-900 font-bold uppercase text-sm">Total pagado</CardTitle>
            </CardHeader>
            <CardContent className="text-cyan-950 font-bold text-3xl">{formatMoney(resumen.totalRecaudado)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saldo total pendiente</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatMoney(resumen.totalPorCobrar)}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar y configurar columnas</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buscador y configuración de columnas en una línea, Buscador en amarillo */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowColumnsPanel((prev) => !prev)}
                  className="whitespace-nowrap font-medium"
                >
                  Configurar columnas
                </Button>

                {showColumnsPanel && (
                  <div className="absolute z-10 mt-2 w-full min-w-[300px] md:w-[420px] rounded-md border bg-white p-4 shadow-xl left-0">
                    <p className="font-medium mb-3">Columnas visibles</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {COLUMN_OPTIONS.map((item) => (
                        <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={visibleColumns[item.key]}
                            onChange={() => toggleColumn(item.key)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input con fondo amarillo fuerte */}
              <Input
                className="bg-yellow-200 border-yellow-400 text-yellow-900 placeholder:text-yellow-700 font-medium flex-1 h-10"
                placeholder="Buscar por nombre, email, empresa, RUT, ID o medio de pago..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inscritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border-2 border-slate-300 overflow-auto shadow-sm">
              <Table className="min-w-full border-collapse [&_tbody_tr:last-child_td]:border-b-0">
                <TableHeader>
                  <TableRow className="border-b-2 border-blue-700 bg-blue-600">
                    {visibleColumns.id && <TableHead className={tableHeadClass}>ID</TableHead>}
                    {visibleColumns.nombre && <TableHead className={tableHeadClass}>Nombre</TableHead>}
                    {visibleColumns.email && <TableHead className={tableHeadClass}>Email</TableHead>}
                    {visibleColumns.empresa && <TableHead className={tableHeadClass}>Empresa</TableHead>}
                    {visibleColumns.entrada && <TableHead className={tableHeadClass}>Detalle compra</TableHead>}
                    {visibleColumns.montoTotal && <TableHead className={tableHeadClass}>Valor compra</TableHead>}
                    
                    {/* Encabezados destacados en Cian */}
                    {visibleColumns.pagado && <TableHead className={tableHeadCyanClass}>Total pagado</TableHead>}
                    {visibleColumns.saldo && <TableHead className={tableHeadClass}>Saldo pendiente</TableHead>}
                    {visibleColumns.medio && <TableHead className={tableHeadClass}>Medio de pago</TableHead>}
                    {visibleColumns.estado && <TableHead className={tableHeadCyanClass}>Estado</TableHead>}
                    
                    {visibleColumns.gestion && <TableHead className={tableHeadClass}>Gestión</TableHead>}
                    {visibleColumns.fecha && <TableHead className={tableHeadClass}>Fecha inscripción</TableHead>}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibles.length > 0 ? (
                    visibles.map((row, index) => {
                      const montoTotal = toNumber(row.monto_total);
                      const saldoPendiente = toNumber(row.saldo_pendiente);
                      const fullyPaid = montoTotal > 0 && saldoPendiente <= 0;
                      const withoutCharge =
                        montoTotal <= 0 && toNumber(row.monto_pagado_actual) <= 0;

                      return (
                        <TableRow
                          key={row.id_inscripcion}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200 hover:bg-slate-100/70`}
                        >
                          {visibleColumns.id && <TableCell className={tableCellClass}>{row.id_inscripcion}</TableCell>}

                          {visibleColumns.nombre && (
                            <TableCell className={`${tableCellClass} font-medium`}>{row.nombre}</TableCell>
                          )}

                          {visibleColumns.email && <TableCell className={tableCellClass}>{row.email}</TableCell>}

                          {visibleColumns.empresa && (
                            <TableCell className={tableCellClass}>{row.empresa || "-"}</TableCell>
                          )}

                          {visibleColumns.entrada && (
                            <TableCell className={tableCellClass}>
                              {row.tipo_entrada || (
                                <span className="text-gray-500">Sin ticket asignado</span>
                              )}
                            </TableCell>
                          )}

                          {visibleColumns.montoTotal && (
                            <TableCell className={tableCellClass}>{formatMoney(row.monto_total)}</TableCell>
                          )}

                          {/* Celdas destacadas en Cian */}
                          {visibleColumns.pagado && (
                            <TableCell className={tableCellCyanClass}>{formatMoney(row.monto_pagado_actual)}</TableCell>
                          )}

                          {visibleColumns.saldo && (
                            <TableCell className={tableCellClass}>
                              <span
                                className={
                                  fullyPaid
                                    ? "text-green-700 font-bold"
                                    : withoutCharge
                                      ? "text-gray-600 font-medium"
                                      : "text-red-600 font-bold"
                                }
                              >
                                {formatMoney(row.saldo_pendiente)}
                              </span>
                            </TableCell>
                          )}

                          {visibleColumns.medio && (
                            <TableCell className={tableCellClass}>{row.ultimo_medio_pago || "-"}</TableCell>
                          )}

                          {/* Estado destacado en Cian claro */}
                          {visibleColumns.estado && (
                            <TableCell className={tableCellCyanClass}>
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${getBadgeClasses(
                                  row.estado_pago
                                )}`}
                              >
                                {row.estado_pago}
                              </span>
                            </TableCell>
                          )}

                          {visibleColumns.gestion && (
                            <TableCell className={tableCellClass}>
                              <div className="min-w-[220px] space-y-2">
                                <p className="text-xs text-gray-500">
                                  {row.id_tipo_entrada
                                    ? "Con ticket asignado"
                                    : montoTotal > 0
                                      ? "Cobro manual configurado"
                                      : "Sin cobro configurado"}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" onClick={() => openGestion(row)}>
                                    Gestionar pago
                                  </Button>

                                  {row.estado_transaccion && (
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getTransactionBadgeClasses(
                                        row.estado_transaccion
                                      )}`}
                                    >
                                      {row.estado_transaccion}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          )}

                          {visibleColumns.fecha && (
                            <TableCell className={tableCellClass}>{formatDate(row.fecha_inscripcion)}</TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={activeColumnCount}
                        className="text-center py-8 text-gray-500"
                      >
                        No hay resultados para la búsqueda actual.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={activeGestionId !== null} onOpenChange={(open) => !open && setActiveGestionId(null)}>
        {selectedRow && (
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Gestionar pago · Inscripción #{selectedRow.id_inscripcion}
              </DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                <span className="font-bold text-slate-900">{selectedRow.nombre}</span> · {selectedRow.email}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Cuadro de Estado destacado en Cian */}
              <div className="rounded-md border p-3 bg-cyan-200 border-cyan-400 shadow-sm">
                <p className="text-xs text-cyan-900 font-bold uppercase tracking-wider">Estado</p>
                <p className="mt-1 font-black text-cyan-950 text-lg">{selectedRow.estado_pago}</p>
              </div>
              
              <div className="rounded-md border p-3 bg-white shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Valor compra</p>
                <p className="mt-1 font-bold text-lg">{formatMoney(selectedRow.monto_total)}</p>
              </div>
              
              {/* Cuadro de Total Pagado destacado en Cian */}
              <div className="rounded-md border p-3 bg-cyan-200 border-cyan-400 shadow-sm">
                <p className="text-xs text-cyan-900 font-bold uppercase tracking-wider">Total pagado</p>
                <p className="mt-1 font-black text-cyan-950 text-lg">{formatMoney(selectedRow.monto_pagado_actual)}</p>
              </div>

              <div className="rounded-md border p-3 bg-white shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Saldo pendiente</p>
                <p className="mt-1 font-bold text-lg text-red-600">{formatMoney(selectedRow.saldo_pendiente)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 mt-2">
              <div className="space-y-4">
                
                {/* --- NUEVA ZONA DE VALOR MANUAL Y TICKETS --- */}
                <div className="rounded-lg border bg-white p-5 shadow-sm space-y-4 border-l-4 border-l-blue-500">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 flex items-center">
                      <Ticket className="w-5 h-5 mr-2 text-blue-600" />
                      Asignar Ticket y Valor a Cobrar
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Puedes asignarle un ticket para llenar automáticamente el precio. Una vez seleccionado, eres libre de modificar el "Monto a cobrar" si deseas aplicar un recargo o descuento.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Ticket / Entrada
                      </label>
                      <select
                        className="w-full border rounded-md px-3 py-2 bg-slate-50 text-base font-medium h-11 border-slate-300"
                        value={selectedDraft.id_tipo_entrada || ""}
                        disabled={selectedIsSavingObjective}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDraft(selectedRow.id_inscripcion, "id_tipo_entrada", val);
                          
                          // Lógica mágica: Al cambiar de ticket, autocompleta el precio
                          if (val) {
                            const t = tickets.find(t => String(t.id_tipo_entrada) === val);
                            if (t) updateDraft(selectedRow.id_inscripcion, "monto_objetivo_manual", String(t.precio));
                          } else {
                            // Si lo deja en "Sin ticket", vuelve a 0
                            updateDraft(selectedRow.id_inscripcion, "monto_objetivo_manual", "0");
                          }
                        }}
                      >
                        <option value="">Sin ticket (Cobro libre / Cortesía)</option>
                        {tickets.map(t => (
                          <option key={t.id_tipo_entrada} value={t.id_tipo_entrada}>
                            {t.nombre} - {formatMoney(t.precio)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Monto a cobrar final
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="text-lg font-bold bg-yellow-50 border-yellow-300"
                          value={selectedDraft.monto_objetivo_manual}
                          disabled={selectedIsSavingObjective}
                          onChange={(e) =>
                            updateDraft(
                              selectedRow.id_inscripcion,
                              "monto_objetivo_manual",
                              e.target.value
                            )
                          }
                          placeholder="0 = cortesía"
                        />
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        className="bg-slate-800 hover:bg-slate-900"
                        disabled={selectedIsSavingObjective}
                        onClick={() => handleGuardarMontoObjetivo(selectedRow)}
                      >
                        Guardar Monto
                      </Button>
                    </div>
                  </div>

                  {selectedWithoutCharge && (
                    <p className="text-sm text-amber-700 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                      Esta inscripción quedó en $0. Puedes mantenerla así como cortesía o definir un monto antes de registrar pagos.
                    </p>
                  )}
                </div>

                {/* --- ZONA DE PAGOS --- */}
                <div className="rounded-lg border bg-white p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Registrar pago o generar link de pago por Flow</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Los pagos siempre recalculan el estado según el saldo real. Nunca se marcará como pagado si el total abonado no completa el cobro.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Monto pagado / abono a registrar
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="text-lg font-medium"
                      value={selectedDraft.monto}
                      disabled={selectedIsProcessing || selectedFullyPaid || selectedMontoTotal <= 0}
                      onChange={(e) =>
                        updateDraft(selectedRow.id_inscripcion, "monto", e.target.value)
                      }
                      placeholder={
                        selectedIsFlow ? "Vacío = cobrar el total del saldo pendiente" : "Ej: 15000"
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Medio de pago</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 bg-white text-base font-medium h-11"
                      value={selectedDraft.medio_pago}
                      disabled={selectedIsProcessing || selectedFullyPaid || selectedMontoTotal <= 0}
                      onChange={(e) =>
                        updateDraft(
                          selectedRow.id_inscripcion,
                          "medio_pago",
                          e.target.value
                        )
                      }
                    >
                      {MEDIOS_PAGO_DISPONIBLES.map((medio) => (
                        <option key={medio} value={medio}>
                          {medio}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Notas u observaciones</label>
                    <Textarea
                      value={selectedDraft.nota}
                      disabled={selectedIsProcessing || selectedFullyPaid || selectedMontoTotal <= 0}
                      onChange={(e) =>
                        updateDraft(selectedRow.id_inscripcion, "nota", e.target.value)
                      }
                      placeholder={
                        selectedIsFlow
                          ? "Ej: Abono pendiente para enviar por correo"
                          : "Ej: Pago recibido en caja o número de transferencia"
                      }
                      className="min-h-[88px]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="lg"
                      className={selectedIsFlow ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                      disabled={selectedIsProcessing || selectedFullyPaid || selectedMontoTotal <= 0}
                      onClick={() => handleProcesarPago(selectedRow)}
                    >
                      {selectedIsFlow ? "Generar link de pago por Flow" : "Registrar pago manual"}
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      disabled={selectedIsHistoryLoading}
                      onClick={() => fetchHistorial(selectedRow.id_inscripcion)}
                    >
                      Recargar historial
                    </Button>
                  </div>

                  {selectedDraft.generated_link && (
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-4 space-y-3 mt-4">
                      <p className="text-sm font-bold text-sky-900">
                        🔗 Link listo para enviar al cliente
                      </p>
                      <p className="break-all text-sm font-medium text-sky-800 bg-white p-2 border rounded">
                        {selectedDraft.generated_link}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="bg-sky-600 hover:bg-sky-700 text-white"
                          onClick={() =>
                            copyToClipboard(
                              selectedDraft.generated_link || "",
                              "Link copiado al portapapeles."
                            )
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar link
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              selectedDraft.generated_link || "",
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir pestaña de pago
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedFullyPaid && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded text-green-800 font-bold text-center">
                      ✅ Esta inscripción ya está completamente pagada.
                    </div>
                  )}

                  {selectedMontoTotal <= 0 && !selectedFullyPaid && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-800 font-bold text-center text-sm">
                      ⚠️ Primero define el ticket o monto a cobrar arriba.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-5 shadow-sm self-start sticky top-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Historial de pagos</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Últimos movimientos registrados.
                    </p>
                  </div>

                  {selectedRow.estado_transaccion && (
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-bold ${getTransactionBadgeClasses(
                        selectedRow.estado_transaccion
                      )}`}
                    >
                      {selectedRow.estado_transaccion}
                    </span>
                  )}
                </div>

                {selectedIsHistoryLoading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm font-medium text-gray-500">Cargando historial...</p>
                  </div>
                ) : selectedHistorial.length ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {selectedHistorial.map((mov) => (
                      <div key={mov.id_movimiento} className="rounded-md border border-slate-200 bg-slate-50 p-3 shadow-sm">
                        <div className="flex flex-col gap-1 mb-2">
                          <div className="font-bold text-lg text-slate-800">
                            {formatMoney(mov.monto)} 
                          </div>
                          <div className="text-sm font-semibold text-blue-700">
                            Medio: {mov.medio_pago}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                          <span className="font-medium">{mov.tipo_registro} · {mov.estado}</span>
                          <span>{formatDate(mov.fecha_pago || mov.fecha_creado)}</span>
                        </div>

                        {mov.orden_compra && (
                          <div className="text-xs text-slate-600 font-mono mt-1 bg-white p-1 rounded inline-block border">
                            Ref: {mov.orden_compra}
                          </div>
                        )}

                        {mov.observacion && (
                          <div className="text-sm text-slate-700 mt-2 bg-white p-2 rounded border italic">
                            "{mov.observacion}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed rounded-md bg-slate-50">
                    <p className="text-sm font-medium text-gray-500">
                      No hay movimientos registrados todavía.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </MainLayout>
  );
}