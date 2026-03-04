"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api";

type EstadoPago =
  | "No Aplica"
  | "Pendiente"
  | "Pagado"
  | "Rechazado"
  | "Reembolsado";

interface AsistenteTesoreria {
  id_inscripcion: number;
  nombre: string;
  email: string;
  empresa: string | null;
  rut: string | null;
  tipo_entrada: string | null;
  monto_ref: number | string | null;
  monto_pagado_actual: number | string | null;
  monto_pagado_manual: number | string | null;
  estado_transaccion: string | null;
  estado_pago: EstadoPago;
  fecha_inscripcion: string;
  nota: string | null;
}

interface CampanaInfo {
  id_campana: number;
  nombre: string;
  obligatorio_pago: boolean;
}

const ESTADOS_PAGO: EstadoPago[] = [
  "Pendiente",
  "Pagado",
  "Rechazado",
  "Reembolsado",
  "No Aplica",
];

export default function TesoreriaCampanaPage() {
  const router = useRouter();
  const params = useParams();
  const id_campana = params.id_campana as string;

  const [campana, setCampana] = useState<CampanaInfo | null>(null);
  const [rows, setRows] = useState<AsistenteTesoreria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoPago | "Todos">("Todos");
  const [savingId, setSavingId] = useState<number | null>(null);

  const toNumber = (value: number | string | null | undefined) => {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
  };

  const fetchAsistentes = useCallback(async () => {
    const response = await apiFetch(`/campanas/tesoreria/${id_campana}/asistentes`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "No se pudieron cargar los inscritos.");
    }

    const data = Array.isArray(result.data) ? result.data : [];
    setRows(data);
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

  useEffect(() => {
    if (id_campana) {
      fetchPage();
    }
  }, [id_campana, fetchPage]);

  const visibles = useMemo(() => {
    let data = [...rows];

    if (estadoFiltro !== "Todos") {
      data = data.filter((r) => r.estado_pago === estadoFiltro);
    }

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
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
    }

    return data;
  }, [rows, searchTerm, estadoFiltro]);

  const resumen = useMemo(() => {
    const totalReferencial = rows.reduce((acc, row) => acc + toNumber(row.monto_ref), 0);
    const totalRecaudado = rows.reduce(
      (acc, row) => acc + toNumber(row.monto_pagado_actual),
      0
    );
    const totalPorCobrar = rows.reduce((acc, row) => {
      const pendiente = Math.max(
        toNumber(row.monto_ref) - toNumber(row.monto_pagado_actual),
        0
      );
      return acc + pendiente;
    }, 0);

    return {
      total: rows.length,
      pendientes: rows.filter((r) => r.estado_pago === "Pendiente").length,
      pagados: rows.filter((r) => r.estado_pago === "Pagado").length,
      rechazados: rows.filter((r) => r.estado_pago === "Rechazado").length,
      reembolsados: rows.filter((r) => r.estado_pago === "Reembolsado").length,
      totalReferencial,
      totalRecaudado,
      totalPorCobrar,
      porcentajeRecaudado:
        totalReferencial > 0 ? (totalRecaudado / totalReferencial) * 100 : 0,
    };
  }, [rows]);

  const formatMoney = (value: number | string | null) => {
    const num = toNumber(value);
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("es-CL");
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

  const handleMontoChange = (id_inscripcion: number, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id_inscripcion === id_inscripcion
          ? { ...row, monto_pagado_manual: value }
          : row
      )
    );
  };

  const normalizeMonto = (value: number | string | null) => {
    if (value === null || value === "") {
      return { ok: true as const, value: null };
    }

    const monto = Number(value);

    if (!Number.isFinite(monto) || monto < 0) {
      return {
        ok: false as const,
        error: "El monto pagado debe ser un número válido mayor o igual a 0.",
      };
    }

    return { ok: true as const, value: monto };
  };

  const handleSaveRow = async (
    targetRow: AsistenteTesoreria,
    nuevoEstado?: EstadoPago
  ) => {
    if (savingId !== null) return;

    const estadoFinal = nuevoEstado || targetRow.estado_pago;
    const montoNormalizado = normalizeMonto(targetRow.monto_pagado_manual);

    if (!montoNormalizado.ok) {
      toast.error(montoNormalizado.error);
      return;
    }

    const previous = [...rows];
    setSavingId(targetRow.id_inscripcion);

    setRows((prev) =>
      prev.map((row) =>
        row.id_inscripcion === targetRow.id_inscripcion
          ? {
              ...row,
              estado_pago: estadoFinal,
              monto_pagado_manual:
                montoNormalizado.value === null ? "" : String(montoNormalizado.value),
            }
          : row
      )
    );

    const toastId = toast.loading("Guardando...");

    try {
      const response = await apiFetch(
        `/campanas/tesoreria/inscripciones/${targetRow.id_inscripcion}/estado-pago`,
        {
          method: "PUT",
          body: JSON.stringify({
            estado_pago: estadoFinal,
            monto_pagado: montoNormalizado.value,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "No se pudo actualizar.");
      }

      await fetchAsistentes();
      toast.success("Pago actualizado.", { id: toastId });
    } catch (error: any) {
      setRows(previous);
      toast.error(error.message || "Error al actualizar.", { id: toastId });
    } finally {
      setSavingId(null);
    }
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
          </div>

          <Button variant="outline" onClick={() => router.push("/tesoreria")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent>{resumen.total}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pendientes</CardTitle>
            </CardHeader>
            <CardContent>{resumen.pendientes}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagados</CardTitle>
            </CardHeader>
            <CardContent>{resumen.pagados}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rechazados</CardTitle>
            </CardHeader>
            <CardContent>{resumen.rechazados}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reembolsados</CardTitle>
            </CardHeader>
            <CardContent>{resumen.reembolsados}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referencial</CardTitle>
            </CardHeader>
            <CardContent>{formatMoney(resumen.totalReferencial)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recaudado</CardTitle>
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
            <CardTitle>Avance de cobranza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-green-500"
                style={{
                  width: `${Math.min(
                    Math.max(resumen.porcentajeRecaudado, 0),
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {resumen.porcentajeRecaudado.toFixed(1)}% del monto referencial recaudado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Buscar por nombre, email, empresa, RUT o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="border rounded-md px-3 py-2 bg-white"
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(e.target.value as EstadoPago | "Todos")
              }
            >
              <option value="Todos">Todos</option>
              {ESTADOS_PAGO.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Monto ref.</TableHead>
                    <TableHead>Pagado actual</TableHead>
                    <TableHead>Monto manual</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                    <TableHead>Fecha inscripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibles.length > 0 ? (
                    visibles.map((row) => (
                      <TableRow key={row.id_inscripcion}>
                        <TableCell>{row.id_inscripcion}</TableCell>
                        <TableCell className="font-medium">{row.nombre}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.empresa || "-"}</TableCell>
                        <TableCell>{row.tipo_entrada || "-"}</TableCell>
                        <TableCell>{formatMoney(row.monto_ref)}</TableCell>
                        <TableCell>{formatMoney(row.monto_pagado_actual)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={row.monto_pagado_manual ?? ""}
                            disabled={savingId === row.id_inscripcion}
                            onChange={(e) =>
                              handleMontoChange(row.id_inscripcion, e.target.value)
                            }
                            placeholder="Automático"
                            className="min-w-[140px]"
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClasses(
                              row.estado_pago
                            )}`}
                          >
                            {row.estado_pago}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2 min-w-[220px]">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={row.estado_pago === "Pagado" ? "secondary" : "default"}
                                disabled={savingId === row.id_inscripcion}
                                onClick={() => handleSaveRow(row, "Pagado")}
                              >
                                Pagado
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={savingId === row.id_inscripcion}
                                onClick={() => handleSaveRow(row, "Pendiente")}
                              >
                                Pendiente
                              </Button>
                            </div>

                            <div className="flex gap-2">
                              <select
                                className="border rounded px-2 py-1 text-sm bg-white flex-1"
                                value={row.estado_pago}
                                disabled={savingId === row.id_inscripcion}
                                onChange={(e) =>
                                  handleSaveRow(
                                    row,
                                    e.target.value as EstadoPago
                                  )
                                }
                              >
                                {ESTADOS_PAGO.map((estado) => (
                                  <option key={estado} value={estado}>
                                    {estado}
                                  </option>
                                ))}
                              </select>

                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={savingId === row.id_inscripcion}
                                onClick={() => handleSaveRow(row)}
                              >
                                Guardar
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(row.fecha_inscripcion)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        No hay resultados para los filtros seleccionados.
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
