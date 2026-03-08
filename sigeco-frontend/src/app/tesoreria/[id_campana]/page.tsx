"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  nombre: string;
  email: string;
  empresa: string | null;
  rut: string | null;
  tipo_entrada: string | null;
  monto_total: number | string | null;
  monto_ref: number | string | null;
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
  { key: "entrada", label: "Entrada" },
  { key: "montoTotal", label: "Monto total" },
  { key: "pagado", label: "Total pagado" },
  { key: "saldo", label: "Saldo pendiente" },
  { key: "medio", label: "Último medio" },
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
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [drafts, setDrafts] = useState<DraftsState>({});
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumnsState>(
    DEFAULT_VISIBLE_COLUMNS
  );

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

  const setGeneratedLink = (
    id_inscripcion: number,
    redirectUrl: string,
    clearFields = true
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id_inscripcion]: {
        ...(prev[id_inscripcion] || getEmptyDraft()),
        generated_link: redirectUrl,
        monto: clearFields ? "" : prev[id_inscripcion]?.monto || "",
        nota: clearFields ? "" : prev[id_inscripcion]?.nota || "",
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

  const handleToggleHistory = async (row: AsistenteTesoreria) => {
    const rowKey = `history-${row.id_inscripcion}`;

    if (expandedRows[row.id_inscripcion]) {
      setExpandedRows((prev) => ({
        ...prev,
        [row.id_inscripcion]: false,
      }));
      return;
    }

    try {
      setSavingKey(rowKey);

      if (!historial[row.id_inscripcion]) {
        await fetchHistorial(row.id_inscripcion);
      }

      setExpandedRows((prev) => ({
        ...prev,
        [row.id_inscripcion]: true,
      }));
    } catch (error: any) {
      toast.error(error.message || "No se pudo abrir el historial.");
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

      if (expandedRows[row.id_inscripcion]) {
        await fetchHistorial(row.id_inscripcion);
      }

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

      if (expandedRows[row.id_inscripcion]) {
        await fetchHistorial(row.id_inscripcion);
      }

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

  return (
    <MainLayout title="Tesorería">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Tesorería</h1>
            <p className="text-gray-500">
              {campana?.nombre || `Campaña #${id_campana}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Gestión de pagos manuales, pagos parciales y links de cobro.
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
              <CardTitle>Total recaudado</CardTitle>
            </CardHeader>
            <CardContent>{formatMoney(resumen.totalRecaudado)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por cobrar</CardTitle>
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
                      <label
                        key={item.key}
                        className="flex items-center gap-2 text-sm"
                      >
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
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.id && <TableHead>ID</TableHead>}
                    {visibleColumns.nombre && <TableHead>Nombre</TableHead>}
                    {visibleColumns.email && <TableHead>Email</TableHead>}
                    {visibleColumns.empresa && <TableHead>Empresa</TableHead>}
                    {visibleColumns.entrada && <TableHead>Entrada</TableHead>}
                    {visibleColumns.montoTotal && <TableHead>Monto total</TableHead>}
                    {visibleColumns.pagado && <TableHead>Total pagado</TableHead>}
                    {visibleColumns.saldo && <TableHead>Saldo pendiente</TableHead>}
                    {visibleColumns.medio && <TableHead>Último medio</TableHead>}
                    {visibleColumns.estado && <TableHead>Estado</TableHead>}
                    {visibleColumns.gestion && <TableHead>Gestión</TableHead>}
                    {visibleColumns.fecha && <TableHead>Fecha inscripción</TableHead>}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibles.length > 0 ? (
                    visibles.map((row) => {
                      const draft = getDraft(row.id_inscripcion);
                      const montoTotal = toNumber(row.monto_total);
                      const saldoPendiente = toNumber(row.saldo_pendiente);
                      const noTieneCobroAsignado =
                        row.estado_pago === "No Aplica" || montoTotal <= 0;
                      const fullyPaid =
                        !noTieneCobroAsignado &&
                        (row.estado_pago === "Pagado" ||
                          (montoTotal > 0 && saldoPendiente <= 0));
                      const isProcessing = isBusy(`payment-${row.id_inscripcion}`);
                      const isHistoryBusy = isBusy(`history-${row.id_inscripcion}`);
                      const isFlow = draft.medio_pago === "Flow";

                      return (
                        <Fragment key={row.id_inscripcion}>
                          <TableRow>
                            {visibleColumns.id && (
                              <TableCell>{row.id_inscripcion}</TableCell>
                            )}

                            {visibleColumns.nombre && (
                              <TableCell className="font-medium">{row.nombre}</TableCell>
                            )}

                            {visibleColumns.email && (
                              <TableCell>{row.email}</TableCell>
                            )}

                            {visibleColumns.empresa && (
                              <TableCell>{row.empresa || "-"}</TableCell>
                            )}

                            {visibleColumns.entrada && (
                              <TableCell>{row.tipo_entrada || "-"}</TableCell>
                            )}

                            {visibleColumns.montoTotal && (
                              <TableCell>{formatMoney(row.monto_total)}</TableCell>
                            )}

                            {visibleColumns.pagado && (
                              <TableCell>{formatMoney(row.monto_pagado_actual)}</TableCell>
                            )}

                            {visibleColumns.saldo && (
                              <TableCell>
                                <span
                                  className={
                                    fullyPaid
                                      ? "text-green-700 font-medium"
                                      : "text-yellow-700 font-medium"
                                  }
                                >
                                  {formatMoney(row.saldo_pendiente)}
                                </span>
                              </TableCell>
                            )}

                            {visibleColumns.medio && (
                              <TableCell>{row.ultimo_medio_pago || "-"}</TableCell>
                            )}

                            {visibleColumns.estado && (
                              <TableCell>
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
                              <TableCell>
                                <div className="flex flex-col gap-3 min-w-[360px]">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Monto del pago / abono
                                    </label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={draft.monto}
                                      disabled={isProcessing || fullyPaid}
                                      onChange={(e) =>
                                        updateDraft(
                                          row.id_inscripcion,
                                          "monto",
                                          e.target.value
                                        )
                                      }
                                      placeholder={
                                        isFlow
                                          ? "Vacío = saldo pendiente"
                                          : "Ej: 15000"
                                      }
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Medio de pago
                                    </label>
                                    <select
                                      className="w-full border rounded-md px-3 py-2 bg-white"
                                      value={draft.medio_pago}
                                      disabled={isProcessing || fullyPaid}
                                      onChange={(e) =>
                                        updateDraft(
                                          row.id_inscripcion,
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
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Notas
                                    </label>
                                    <Textarea
                                      value={draft.nota}
                                      disabled={isProcessing || fullyPaid}
                                      onChange={(e) =>
                                        updateDraft(
                                          row.id_inscripcion,
                                          "nota",
                                          e.target.value
                                        )
                                      }
                                      placeholder={
                                        isFlow
                                          ? "Ej: Abono pendiente para enviar por correo"
                                          : "Ej: Pago recibido en caja / observaciones"
                                      }
                                      className="min-h-[88px]"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <Button
                                      size="sm"
                                      disabled={isProcessing || fullyPaid}
                                      onClick={() => handleProcesarPago(row)}
                                    >
                                      {isFlow ? "Generar link de pago" : "Registrar pago"}
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      disabled={isHistoryBusy}
                                      onClick={() => handleToggleHistory(row)}
                                    >
                                      {expandedRows[row.id_inscripcion]
                                        ? "Ocultar historial"
                                        : "Ver historial"}
                                    </Button>
                                  </div>

                                  {draft.generated_link && (
                                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 space-y-2">
                                      <p className="text-sm font-medium text-sky-900">
                                        Link listo para enviar al cliente
                                      </p>
                                      <p className="break-all text-xs text-sky-800">
                                        {draft.generated_link}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            copyToClipboard(
                                              draft.generated_link || "",
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
                                              draft.generated_link || "",
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
                                    {isFlow
                                      ? "Si dejas vacío el monto para Flow, se usará automáticamente el saldo pendiente."
                                      : "Con Efectivo, Transferencia, Cortesía u Otro, el pago se registra directamente y el estado se recalcula según el saldo."}
                                  </p>

                                  {fullyPaid && (
                                    <p className="text-xs text-green-700 font-medium">
                                      Esta inscripción ya está completamente pagada.
                                    </p>
                                  )}

                                  {!fullyPaid && noTieneCobroAsignado && (
                                    <p className="text-xs text-amber-700 font-medium">
                                      Esta inscripción no tiene ticket o cobro asignado.
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            )}

                            {visibleColumns.fecha && (
                              <TableCell>{formatDate(row.fecha_inscripcion)}</TableCell>
                            )}
                          </TableRow>

                          {expandedRows[row.id_inscripcion] && (
                            <TableRow>
                              <TableCell
                                colSpan={activeColumnCount}
                                className="bg-gray-50"
                              >
                                <div className="p-2">
                                  <p className="font-medium mb-3">
                                    Historial de pagos de la inscripción #
                                    {row.id_inscripcion}
                                  </p>

                                  {historial[row.id_inscripcion]?.length ? (
                                    <div className="space-y-2">
                                      {historial[row.id_inscripcion].map((mov) => (
                                        <div
                                          key={mov.id_movimiento}
                                          className="rounded-md border bg-white p-3"
                                        >
                                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                                            <div className="font-medium">
                                              {formatMoney(mov.monto)} · {mov.medio_pago}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              {formatDate(
                                                mov.fecha_pago || mov.fecha_creado
                                              )}
                                            </div>
                                          </div>

                                          <div className="text-sm text-gray-600 mt-1">
                                            {mov.tipo_registro} · {mov.estado}
                                            {mov.orden_compra
                                              ? ` · ${mov.orden_compra}`
                                              : ""}
                                          </div>

                                          {mov.observacion && (
                                            <div className="text-sm text-gray-600 mt-1">
                                              {mov.observacion}
                                            </div>
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
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
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
    </MainLayout>
  );
}