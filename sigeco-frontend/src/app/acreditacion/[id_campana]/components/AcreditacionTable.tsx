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
  // Creamos un mapa para buscar la info de cada campo por su nombre_interno fácilmente
  const camposMap = useMemo(() => {
    const map = new Map<string, CampoFormulario>();
    camposFormulario.forEach((campo) => {
      map.set(campo.nombre_interno, campo);
    });
    return map;
  }, [camposFormulario]);

  // Obtenemos los objetos completos de las columnas que son visibles, en el orden correcto
  // 🔧 Aseguramos que 'estado_asistencia' SIEMPRE esté visible por defecto
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

  // Función para renderizar el contenido de una celda
  const renderCellContent = (asistente: Asistente, campo: CampoFormulario) => {
    const value = (asistente as any)[campo.nombre_interno];

    if (campo.nombre_interno === "estado_asistencia") {
      if (value === "Asistió") {
        // Mostrar "Acreditado" (sin cambiar la lógica interna) y más marcado visualmente
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
            <th className="px-4 py-3 text-left text-sm font-semibold text-black">
              #
            </th>

            {/* Cabeceras dinámicas */}
            {orderedVisibleColumns.map((campo) => (
              <th
                key={campo.id_campo}
                className="px-4 py-3 text-left text-sm font-semibold text-black"
              >
                {campo.etiqueta}
              </th>
            ))}

            <th className="px-4 py-3 text-left text-sm font-semibold text-black">
              Acción
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {asistentes.map((asistente, index) => (
            <tr
              key={asistente.id_inscripcion}
              className={[
                updatingId === asistente.id_inscripcion ? "opacity-50" : "",
                // Resaltar fila acreditada sin cambiar la condición lógica
                asistente.estado_asistencia === "Asistió" ? "bg-green-50" : "",
              ]
                .join(" ")
                .trim()}
            >
              <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>

              {/* Celdas dinámicas */}
              {orderedVisibleColumns.map((campo) => (
                <td
                  key={campo.id_campo}
                  className="px-4 py-2 text-sm text-gray-700"
                >
                  {renderCellContent(asistente, campo)}
                </td>
              ))}

              <td className="px-4 py-2 text-sm">
                {updatingId === asistente.id_inscripcion ? (
                  <span className="text-gray-500 font-medium">
                    Actualizando...
                  </span>
                ) : asistente.estado_asistencia !== "Asistió" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        onUpdateStatus(asistente.id_inscripcion, "acreditado")
                      }
                    >
                      Acreditar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        onUpdateStatus(asistente.id_inscripcion, "denegado")
                      }
                    >
                      Denegar
                    </Button>
                  </div>
                ) : (
                  // ⚠️ Confirmación al revertir
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        Revertir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Revertir acreditación?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción marcará al asistente como{" "}
                          <strong>Pendiente</strong>. Puedes volver a
                          acreditarlo más tarde.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            onUpdateStatus(
                              asistente.id_inscripcion,
                              "pendiente"
                            )
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
