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
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
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

interface PaymentDraft {
  monto: string;
  monto_objetivo_manual: string;
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
  medio_pago: "Efectivo",
  nota: "",
  generated_link: null,
});

export default function TesoreriaCampanaPage() {
  const router = useRouter();
  const params = useParams();
  const id_campana = params.id_campana as string;

  const [campana, setCampana] = useState<CampanaInfo | null>(null);
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
        next[row.id_inscripcion] = {
          ...getEmptyDraft(),
          ...(next[row.id_inscripcion] || {}),
          monto_objetivo_manual:
            row.id_tipo_entrada === null
              ? String(toNumber(row.monto_objetivo_manual))
              : next[row.id_inscripcion]?.monto_objetivo_manual || "",
        };
      }
      return next;
    });

    return data;
  }, [id_campana]);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);

      const campanaRes = await apiFetch(`/campanas/${id_campana}`);
      const campanaJson = await campanaRes.json();

      if (!campanaRes.ok || !campanaJson.success) {
        throw new Error(campanaJson.error || "No se pudo cargar la campaña.");
      }

      setCampana(campanaJson.data);
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
    if (row.id_tipo_entrada) {
      toast.error("No puedes editar el monto manual si la inscripción tiene ticket.");
      return;
    }

    const draft = getDraft(row.id_inscripcion);
    const monto = Number(draft.monto_objetivo_manual);

    if (!Number.isFinite(monto) || monto < 0) {
      toast.error("Escribe un monto manual válido mayor o igual a 0.");
      return;
    }

    const key = `objective-${row.id_inscripcion}`;
    const toastId = toast.loading("Guardando monto manual...");

    try {
      setSavingKey(key);

      const response = await apiFetch(
        `/campanas/tesoreria/inscripciones/${row.id_inscripcion}/monto-objetivo-manual`,
        {
          method: "PUT",
          body: JSON.stringify({ monto_objetivo_manual: monto }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "No se pudo guardar el monto manual.");
      }

      await fetchAsistentes();
      await fetchHistorial(row.id_inscripcion);

      toast.success(
        monto === 0
          ? "Monto manual actualizado. La inscripción quedó como cortesía/sin cobro."
          : "Monto manual actualizado correctamente.",
        { id: toastId }
      );
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el monto manual.", {
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
        row.id_tipo_entrada
          ? "Esta inscripción no tiene un monto de cobro válido."
          : "Primero define el monto manual de cobro. Usa 0 si será una cortesía."
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
  const tableHeadClass =
    "whitespace-nowrap border-r border-slate-300 bg-slate-100 px-3 py-3 text-slate-700 font-semibold last:border-r-0";
  const tableCellClass =
    "border-r border-slate-200 px-3 py-3 align-top last:border-r-0";

  return (
    <MainLayout title="Tesorería">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Tesorería</h1>
            <p className="text-gray-500">{campana?.nombre || `Campaña #${id_campana}`}</p>
            <p className="text-sm text-gray-500 mt-1">
              Gestión de pagos manuales, abonos, montos manuales y links de cobro.
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
            <CardContent>{resumen.total}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Con saldo pendiente</CardTitle>
            </CardHeader>
            <CardContent>{resumen.conSaldoPendiente}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total ingresos</CardTitle>
            </CardHeader>
            <CardContent>{formatMoney(resumen.totalRecaudado)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saldo total pendiente</CardTitle>
            </CardHeader>
            <CardContent>{formatMoney(resumen.totalPorCobrar)}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar y configurar columnas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por nombre, email, empresa, RUT, ID o medio de pago..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowColumnsPanel((prev) => !prev)}
              >
                Configurar columnas
              </Button>

              {showColumnsPanel && (
                <div className="absolute z-10 mt-2 w-full md:w-[420px] rounded-md border bg-white p-4 shadow-lg">
                  <p className="font-medium mb-3">Columnas visibles</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {COLUMN_OPTIONS.map((item) => (
                      <label key={item.key} className="flex items-center gap-2 text-sm">
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
                  <TableRow className="border-b-2 border-slate-300 bg-slate-100 hover:bg-slate-100">
                    {visibleColumns.id && <TableHead className={tableHeadClass}>ID</TableHead>}
                    {visibleColumns.nombre && <TableHead className={tableHeadClass}>Nombre</TableHead>}
                    {visibleColumns.email && <TableHead className={tableHeadClass}>Email</TableHead>}
                    {visibleColumns.empresa && <TableHead className={tableHeadClass}>Empresa</TableHead>}
                    {visibleColumns.entrada && <TableHead className={tableHeadClass}>Detalle compra</TableHead>}
                    {visibleColumns.montoTotal && <TableHead className={tableHeadClass}>Valor compra</TableHead>}
                    {visibleColumns.pagado && <TableHead className={tableHeadClass}>Total pagado</TableHead>}
                    {visibleColumns.saldo && <TableHead className={tableHeadClass}>Saldo pendiente</TableHead>}
                    {visibleColumns.medio && <TableHead className={tableHeadClass}>Medio de pago</TableHead>}
                    {visibleColumns.estado && <TableHead className={tableHeadClass}>Estado</TableHead>}
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
                          className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"} border-b border-slate-200 hover:bg-slate-100/70`}
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
                                <span className="text-gray-500">Sin ticket</span>
                              )}
                            </TableCell>
                          )}

                          {visibleColumns.montoTotal && (
                            <TableCell className={tableCellClass}>{formatMoney(row.monto_total)}</TableCell>
                          )}

                          {visibleColumns.pagado && (
                            <TableCell className={tableCellClass}>{formatMoney(row.monto_pagado_actual)}</TableCell>
                          )}

                          {visibleColumns.saldo && (
                            <TableCell className={tableCellClass}>
                              <span
                                className={
                                  fullyPaid
                                    ? "text-green-700 font-medium"
                                    : withoutCharge
                                      ? "text-gray-600 font-medium"
                                      : "text-yellow-700 font-medium"
                                }
                              >
                                {formatMoney(row.saldo_pendiente)}
                              </span>
                            </TableCell>
                          )}

                          {visibleColumns.medio && (
                            <TableCell className={tableCellClass}>{row.ultimo_medio_pago || "-"}</TableCell>
                          )}

                          {visibleColumns.estado && (
                            <TableCell className={tableCellClass}>
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClasses(
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
                                    ? "Valor definido por ticket"
                                    : montoTotal > 0
                                      ? "Pago manual configurable"
                                      : "Sin cobro configurado / cortesía"}
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
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Gestionar pago · Inscripción #{selectedRow.id_inscripcion}
              </DialogTitle>
              <DialogDescription>
                {selectedRow.nombre} · {selectedRow.email}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-gray-500">Estado</p>
                <p className="mt-1 font-semibold">{selectedRow.estado_pago}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-gray-500">Valor compra</p>
                <p className="mt-1 font-semibold">{formatMoney(selectedRow.monto_total)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-gray-500">Total pagado</p>
                <p className="mt-1 font-semibold">{formatMoney(selectedRow.monto_pagado_actual)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-gray-500">Saldo pendiente</p>
                <p className="mt-1 font-semibold">{formatMoney(selectedRow.saldo_pendiente)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
              <div className="space-y-4">
                <div className="rounded-md border p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">Valor manual a pagar</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedTieneTicket
                        ? "Esta inscripción usa el precio del ticket y no permite edición manual."
                        : "Cuando no hay ticket, este monto define cuánto se debe cobrar. Usa 0 para cortesía o sin cobro."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Pago manual
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={selectedDraft.monto_objetivo_manual}
                        disabled={selectedTieneTicket || selectedIsSavingObjective}
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
                      disabled={selectedTieneTicket || selectedIsSavingObjective}
                      onClick={() => handleGuardarMontoObjetivo(selectedRow)}
                    >
                      Guardar monto
                    </Button>
                  </div>

                  {!selectedTieneTicket && selectedWithoutCharge && (
                    <p className="text-xs text-amber-700 font-medium">
                      Esta inscripción quedó sin cobro. Puedes mantenerla en 0 como cortesía o definir un monto manual antes de registrar pagos.
                    </p>
                  )}
                </div>

                <div className="rounded-md border p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">Registrar pago o generar link</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Los pagos siempre recalculan el estado según el saldo real. Nunca se marcará como pagado si el total abonado no completa el cobro.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Monto pagado / abono
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={selectedDraft.monto}
                      disabled={selectedIsProcessing || selectedFullyPaid || selectedMontoTotal <= 0}
                      onChange={(e) =>
                        updateDraft(selectedRow.id_inscripcion, "monto", e.target.value)
                      }
                      placeholder={
                        selectedIsFlow ? "Vacío = saldo pendiente" : "Ej: 15000"
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Medio de pago</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 bg-white"
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
                    <label className="block text-xs text-gray-500 mb-1">Notas</label>
                    <Textarea
                      value={selectedDraft.nota}
                      disabled={selectedIsProcessing || selectedFullyPaid || selectedMontoTotal <= 0}
                      onChange={(e) =>
                        updateDraft(selectedRow.id_inscripcion, "nota", e.target.value)
                      }
                      placeholder={
                        selectedIsFlow
                          ? "Ej: Abono pendiente para enviar por correo"
                          : "Ej: Pago recibido en caja / observaciones"
                      }
                      className="min-h-[88px]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={selectedIsProcessing || selectedFullyPaid || selectedMontoTotal <= 0}
                      onClick={() => handleProcesarPago(selectedRow)}
                    >
                      {selectedIsFlow ? "Generar link de pago" : "Registrar pago"}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={selectedIsHistoryLoading}
                      onClick={() => fetchHistorial(selectedRow.id_inscripcion)}
                    >
                      Recargar historial
                    </Button>
                  </div>

                  {selectedDraft.generated_link && (
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 space-y-2">
                      <p className="text-sm font-medium text-sky-900">
                        Link listo para enviar al cliente
                      </p>
                      <p className="break-all text-xs text-sky-800">
                        {selectedDraft.generated_link}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
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
                          size="sm"
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
                          Abrir link
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    {selectedIsFlow
                      ? "Si dejas vacío el monto para Flow, se usará automáticamente el saldo pendiente."
                      : "Con Efectivo, Transferencia, Cortesía u Otro, el pago se registra directamente y el estado se recalcula según el saldo."}
                  </p>

                  {selectedFullyPaid && (
                    <p className="text-xs text-green-700 font-medium">
                      Esta inscripción ya está completamente pagada.
                    </p>
                  )}

                  {selectedMontoTotal <= 0 && !selectedFullyPaid && (
                    <p className="text-xs text-amber-700 font-medium">
                      {selectedTieneTicket
                        ? "Esta inscripción no tiene un monto de cobro válido."
                        : "Primero define el monto manual de cobro. Usa 0 si será una cortesía."}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold">Historial de pagos</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Últimos movimientos registrados para esta inscripción.
                    </p>
                  </div>

                  {selectedRow.estado_transaccion && (
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getTransactionBadgeClasses(
                        selectedRow.estado_transaccion
                      )}`}
                    >
                      {selectedRow.estado_transaccion}
                    </span>
                  )}
                </div>

                {selectedIsHistoryLoading ? (
                  <p className="text-sm text-gray-500">Cargando historial...</p>
                ) : selectedHistorial.length ? (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {selectedHistorial.map((mov) => (
                      <div key={mov.id_movimiento} className="rounded-md border bg-white p-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                          <div className="font-medium">
                            {formatMoney(mov.monto)} · {mov.medio_pago}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(mov.fecha_pago || mov.fecha_creado)}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mt-1">
                          {mov.tipo_registro} · {mov.estado}
                          {mov.orden_compra ? ` · ${mov.orden_compra}` : ""}
                        </div>

                        {mov.observacion && (
                          <div className="text-sm text-gray-600 mt-1">{mov.observacion}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay movimientos registrados todavía.
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </MainLayout>
  );
}
