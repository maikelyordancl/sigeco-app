"use client";

import { Asistente, CampoFormulario } from "../types";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";
import { useMemo } from "react";
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
    const base = visibleColumns.includes("estado_asistencia")
      ? visibleColumns
      : [...visibleColumns, "estado_asistencia"];

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

  // --- DIMENSIONES FÍSICAS (GC420t 100x50mm a ~203dpi) ---
  const LABEL_MM = { w: 100, h: 50 };
  const DPI = 203;
  const PX_PER_MM = DPI / 25.4;
  const CANVAS_W = Math.round(LABEL_MM.w * PX_PER_MM); // ~800
  const CANVAS_H = Math.round(LABEL_MM.h * PX_PER_MM); // ~400

  const getAsistenteNombre = (a: Asistente) =>
    (a as any).nombre || (a as any).Nombre || (a as any).NOMBRE || "";

  // Split de 2 líneas balanceadas por longitud
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
    const name = (nameInput || "").toUpperCase().trim(); // medir y dibujar en MAYÚSCULAS
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Márgenes y área útil
    const marginX = Math.round(CANVAS_W * 0.1); // 10%
    const marginY = Math.round(CANVAS_H * 0.18); // 18%
    const usableW = CANVAS_W - 2 * marginX;
    const usableH = CANVAS_H - 2 * marginY;

    // Factor de seguridad para no “quedar justo”
    const SAFE_W = usableW * 0.92;

    const FONT_FAMILY = "Arial Black, Impact, Arial, Helvetica, sans-serif";
    const LINE_HEIGHT = 1.12;
    const minFont = 10;

    // -------- INTENTO 1: UNA LÍNEA --------
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

    // -------- INTENTO 2: DOS LÍNEAS --------
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

    // Dibujo centrado de 2 líneas
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;

    const totalH = 2 * (fontSize * LINE_HEIGHT);
    const startY = (CANVAS_H - totalH) / 2 + fontSize; // baseline primera línea
    ctx.fillText(l1, CANVAS_W / 2, startY);
    ctx.fillText(l2, CANVAS_W / 2, startY + fontSize * LINE_HEIGHT);

    return canvas.toDataURL("image/png");
  };

  // Impresión con iframe oculto (arreglo de tipado TS)
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

    // 👇 Evitamos el narrowing que convierte el else en `never`
    const supportsSrcdoc = typeof (iframe as any).srcdoc !== "undefined";

    if (supportsSrcdoc) {
      iframe.onload = doPrint;
      (iframe as any).srcdoc = html; // usar any para no forzar narrowing
    } else {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        iframe.onload = doPrint;
        doc.open();
        doc.write(html);
        doc.close();
      } else {
        // Fallback defensivo
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
    //printBadge(asistente);
  };

  const renderCellContent = (asistente: Asistente, campo: CampoFormulario) => {
    const value = (asistente as any)[campo.nombre_interno];

    if (campo.nombre_interno === "estado_asistencia") {
      if (value === "Asistió") {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-green-200">
            <BadgeCheck className="w-4 h-4" />
            Acreditado
          </span>
        );
      }
      if (value === "Cancelado") {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-red-200">
            Denegado
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-gray-200">
          Pendiente
        </span>
      );
    }

    return value ?? "-";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-cyan-400 border-b border-cyan-500">
            <th className="px-4 py-3 text-left text-sm font-semibold text-black">#</th>

            {orderedVisibleColumns.map((campo) => (
              <th key={campo.id_campo} className="px-4 py-3 text-left text-sm font-semibold text-black">
                {campo.etiqueta}
              </th>
            ))}

            <th className="px-4 py-3 text-left text-sm font-semibold text-black">Acción</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {asistentes.map((asistente, index) => (
            <tr
              key={asistente.id_inscripcion}
              className={[
                updatingId === asistente.id_inscripcion ? "opacity-50" : "",
                asistente.estado_asistencia === "Asistió" ? "bg-green-50" : "",
              ]
                .join(" ")
                .trim()}
            >
              <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>

              {orderedVisibleColumns.map((campo) => (
                <td key={campo.id_campo} className="px-4 py-2 text-sm text-gray-700">
                  {renderCellContent(asistente, campo)}
                </td>
              ))}

              <td className="px-4 py-2 text-sm">
                {updatingId === asistente.id_inscripcion ? (
                  <span className="text-gray-500 font-medium">Actualizando...</span>
                ) : asistente.estado_asistencia !== "Asistió" ? (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAcreditar(asistente)}>
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
                      <Button size="sm" variant="outline">Revertir</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Revertir acreditación?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción marcará al asistente como <strong>Pendiente</strong>. Puedes volver a acreditarlo más tarde.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onUpdateStatus(asistente.id_inscripcion, "pendiente")}>
                          Sí, revertir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
