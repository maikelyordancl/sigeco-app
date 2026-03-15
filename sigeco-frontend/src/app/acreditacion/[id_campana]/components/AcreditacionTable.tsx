"use client";

import { Asistente, CampoFormulario } from "../types";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  CircleDollarSign,
  XCircle,
  Clock3,
} from "lucide-react";
import { useMemo } from "react";
import { formatCLPCurrency } from "@/lib/money";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AcreditacionTableProps {
  asistentes: Asistente[];
  camposFormulario: CampoFormulario[];
  visibleColumns: string[];
  onUpdateStatus: (
    id_inscripcion: number,
    nuevo_estado: "acreditado" | "denegado" | "pendiente"
  ) => void;
  updatingId?: number | null;
}

export function AcreditacionTable({
  asistentes,
  camposFormulario,
  visibleColumns,
  onUpdateStatus,
  updatingId,
}: AcreditacionTableProps) {
  const camposMap = useMemo(() => {
    const map = new Map<string, CampoFormulario>();
    camposFormulario.forEach((campo) => {
      map.set(campo.nombre_interno, campo);
    });
    return map;
  }, [camposFormulario]);

  const orderedVisibleColumns = useMemo(() => {
    const required = ["nivel", "estado_acreditacion"];
    const base = [...visibleColumns];

    required.forEach((col) => {
      if (!base.includes(col)) base.push(col);
    });

    return base
      .map((nombre_interno) => camposMap.get(nombre_interno))
      .filter((campo): campo is CampoFormulario => campo !== undefined);
  }, [visibleColumns, camposMap]);

  if (!asistentes.length) {
    return (
      <div className="text-center py-10 text-gray-500 border-dashed border-2 rounded-lg">
        No hay asistentes para mostrar.
      </div>
    );
  }

  const LABEL_MM = { w: 100, h: 50 };
  const DPI = 203;
  const PX_PER_MM = DPI / 25.4;
  const CANVAS_W = Math.round(LABEL_MM.w * PX_PER_MM);
  const CANVAS_H = Math.round(LABEL_MM.h * PX_PER_MM);

  const getAsistenteNombre = (a: Asistente) =>
    (a as any).nombre || (a as any).Nombre || (a as any).NOMBRE || "";

  const splitNameForTwoLines = (full: string) => {
    const words = full.trim().split(/\s+/);
    if (words.length <= 1) return [full];
    let best: [string, string] = [full, ""];
    let bestScore = Number.POSITIVE_INFINITY;

    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(" ");
      const l2 = words.slice(i).join(" ");
      const score = Math.abs(l1.length - l2.length);

      if (score < bestScore) {
        best = [l1, l2];
        bestScore = score;
      }
    }

    return best;
  };

  const drawNameToCanvas = (nameInput: string): string => {
    const name = (nameInput || "").toUpperCase().trim();
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const marginX = Math.round(CANVAS_W * 0.1);
    const marginY = Math.round(CANVAS_H * 0.18);
    const usableW = CANVAS_W - 2 * marginX;
    const usableH = CANVAS_H - 2 * marginY;
    const SAFE_W = usableW * 0.92;

    const FONT_FAMILY = "Arial Black, Impact, Arial, Helvetica, sans-serif";
    const LINE_HEIGHT = 1.12;
    const minFont = 10;

    let fontSize = Math.floor(usableH);

    const fitsSingle = () => {
      ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
      const w = ctx.measureText(name).width;
      const h = fontSize * LINE_HEIGHT;
      return w <= SAFE_W && h <= usableH;
    };

    while (fontSize >= minFont && !fitsSingle()) fontSize -= 2;

    if (fontSize >= minFont) {
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
      ctx.fillText(name, CANVAS_W / 2, CANVAS_H / 2);
      return canvas.toDataURL("image/png");
    }

    const [l1raw, l2raw] = splitNameForTwoLines(name);
    const l1 = l1raw.toUpperCase();
    const l2 = l2raw.toUpperCase();

    fontSize = Math.floor(usableH / (2 * LINE_HEIGHT));

    const fitsDouble = () => {
      ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
      const w1 = ctx.measureText(l1).width;
      const w2 = ctx.measureText(l2).width;
      const hTotal = 2 * (fontSize * LINE_HEIGHT);
      return w1 <= SAFE_W && w2 <= SAFE_W && hTotal <= usableH;
    };

    while (fontSize >= minFont && !fitsDouble()) fontSize -= 2;

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;

    const totalH = 2 * (fontSize * LINE_HEIGHT);
    const startY = (CANVAS_H - totalH) / 2 + fontSize;

    ctx.fillText(l1, CANVAS_W / 2, startY);
    ctx.fillText(l2, CANVAS_W / 2, startY + fontSize * LINE_HEIGHT);

    return canvas.toDataURL("image/png");
  };

  const printBadge = (asistente: Asistente) => {
    const raw = (getAsistenteNombre(asistente) || "").toString();
    const nombre = raw.replace(/\s+/g, " ").trim();
    const dataUrl = drawNameToCanvas(nombre);

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Etiqueta</title>
<style>
  @page { size: ${LABEL_MM.w}mm ${LABEL_MM.h}mm; margin: 0; }
  html, body { margin:0; padding:0; width:${LABEL_MM.w}mm; height:${LABEL_MM.h}mm; }
  .wrap { width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:1mm; box-sizing:border-box; }
  img { width:98%; height:98%; object-fit:contain; display:block; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="wrap"><img src="${dataUrl}" alt="etiqueta" /></div>
</body>
</html>`.trim();

    const iframe = document.createElement("iframe") as HTMLIFrameElement;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1200);
      }
    };

    const supportsSrcdoc = typeof (iframe as any).srcdoc !== "undefined";

    if (supportsSrcdoc) {
      iframe.onload = doPrint;
      (iframe as any).srcdoc = html;
    } else {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        iframe.onload = doPrint;
        doc.open();
        doc.write(html);
        doc.close();
      } else {
        const w = window.open("", "_blank");
        if (w) {
          w.document.open();
          w.document.write(html);
          w.document.close();
          w.focus();
          w.print();
          w.close();
        }
      }
    }
  };

  const handleAcreditar = (asistente: Asistente) => {
    onUpdateStatus(asistente.id_inscripcion, "acreditado");
    // printBadge(asistente);
  };

  const formatDateTime = (value: any) => {
    if (!value) return "-";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleString("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrencyCLP = (value: any) => formatCLPCurrency(value);

  const resolveFechaCreacionContacto = (asistente: Asistente) => {
    const raw: any = asistente;
    return (
      raw.fecha_creacion_contacto ??
      raw.contacto_fecha_creacion ??
      raw.created_at_contacto ??
      raw.contacto_created_at ??
      raw.fecha_creacion ??
      raw.created_at ??
      null
    );
  };

  const renderEstadoAcreditacionBadge = (value: any) => {
    const normalized = String(value ?? "").trim().toLowerCase();

    if (normalized === "acreditado") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-900 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-yellow-300">
          <BadgeCheck className="w-4 h-4" />
          Acreditado
        </span>
      );
    }

    if (normalized === "denegado") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-red-200">
          <XCircle className="w-4 h-4" />
          Denegado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-gray-200">
        <Clock3 className="w-4 h-4" />
        Pendiente
      </span>
    );
  };

  const renderEstadoPagoBadge = (value: any) => {
    const normalized = String(value ?? "").trim().toLowerCase();

    if (
      ["pagado", "paid", "aprobado", "approved", "aceptado", "completed", "completado", "exitoso", "exitosa"].includes(
        normalized
      )
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-emerald-300">
          <CircleDollarSign className="w-4 h-4" />
          {value}
        </span>
      );
    }

    if (
      ["pendiente", "pending", "procesando", "en proceso"].includes(normalized)
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-amber-300">
          <Clock3 className="w-4 h-4" />
          {value}
        </span>
      );
    }

    if (
      ["rechazado", "failed", "fallido", "anulado", "cancelado", "declined"].includes(
        normalized
      )
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-red-200">
          <XCircle className="w-4 h-4" />
          {value}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-gray-200">
        <CircleDollarSign className="w-4 h-4" />
        {value ?? "-"}
      </span>
    );
  };

  const renderCellContent = (asistente: Asistente, campo: CampoFormulario) => {
    if (campo.nombre_interno === "fecha_acreditacion") {
      return formatDateTime((asistente as any).fecha_acreditacion);
    }

    if (campo.nombre_interno === "fecha_creacion_contacto") {
      return formatDateTime(resolveFechaCreacionContacto(asistente));
    }

    if (campo.nombre_interno === "estado_acreditacion") {
      return renderEstadoAcreditacionBadge((asistente as any).estado_acreditacion);
    }

    if (campo.nombre_interno === "nivel") {
      return (asistente as any).nivel || "-";
    }

    if (campo.nombre_interno === "estado_pago") {
      return renderEstadoPagoBadge((asistente as any).estado_pago);
    }

    if (campo.nombre_interno === "monto_pagado_actual") {
      return formatCurrencyCLP((asistente as any).monto_pagado_actual);
    }

    const value = (asistente as any)[campo.nombre_interno];
    return value ?? "-";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-cyan-400 border-b border-cyan-500">
            <th className="px-4 py-3 text-left text-sm font-semibold text-black">#</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-black">
              ID Inscripción
            </th>

            {orderedVisibleColumns.map((campo) => (
              <th
                key={campo.id_campo}
                className="px-4 py-3 text-left text-sm font-semibold text-black"
              >
                {campo.etiqueta}
              </th>
            ))}

            <th className="px-4 py-3 text-left text-sm font-semibold text-black">Acción</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {asistentes.map((asistente, index) => {
            const acreditado = (asistente as any).estado_acreditacion === "Acreditado";

            return (
              <tr
                key={asistente.id_inscripcion}
                className={[
                  updatingId === asistente.id_inscripcion ? "opacity-50" : "",
                  acreditado ? "bg-yellow-200" : "",
                ]
                  .join(" ")
                  .trim()}
              >
                <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{asistente.id_inscripcion}</td>

                {orderedVisibleColumns.map((campo) => (
                  <td key={campo.id_campo} className="px-4 py-2 text-sm text-gray-700">
                    {renderCellContent(asistente, campo)}
                  </td>
                ))}

                <td className="px-4 py-2 text-sm">
                  {updatingId === asistente.id_inscripcion ? (
                    <span className="text-gray-500 font-medium">Actualizando...</span>
                  ) : !acreditado ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        onClick={() => handleAcreditar(asistente)}
                      >
                        Acreditar
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onUpdateStatus(asistente.id_inscripcion, "denegado")}
                      >
                        Denegar
                      </Button>
                    </div>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Revertir
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Revertir acreditación?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción marcará al asistente como <strong>Pendiente</strong>.
                            Puedes volver a acreditarlo más tarde.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              onUpdateStatus(asistente.id_inscripcion, "pendiente")
                            }
                          >
                            Sí, revertir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}