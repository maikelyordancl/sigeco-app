"use client";

import { Asistente, CampoFormulario } from "../types";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";
import { useMemo } from "react";

interface AcreditacionTableProps {
  asistentes: Asistente[];
  camposFormulario: CampoFormulario[];
  visibleColumns: string[];
  onUpdateStatus: (id_inscripcion: number, nuevo_estado: 'acreditado' | 'denegado' | 'pendiente') => void;
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
    camposFormulario.forEach(campo => {
      map.set(campo.nombre_interno, campo);
    });
    return map;
  }, [camposFormulario]);
  
  // Obtenemos los objetos completos de las columnas que son visibles, en el orden correcto
  const orderedVisibleColumns = useMemo(() => {
    return visibleColumns
      .map(nombre_interno => camposMap.get(nombre_interno))
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
    const value = asistente[campo.nombre_interno];

    if (campo.nombre_interno === 'estado_asistencia') {
      if (value === "Asistió") {
        return (
          <span className="inline-flex items-center text-green-600 font-medium">
            <BadgeCheck className="w-4 h-4 mr-1" /> Asistió
          </span>
        );
      }
      if (value === "Cancelado") {
        return <span className="text-red-600 font-medium">Denegado</span>;
      }
      return <span className="text-gray-500">Pendiente</span>;
    }

    return value ?? "-";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
            
            {/* Cabeceras dinámicas */}
            {orderedVisibleColumns.map((campo) => (
              <th key={campo.id_campo} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {campo.etiqueta}
              </th>
            ))}

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {asistentes.map((asistente, index) => (
            <tr key={asistente.id_inscripcion} className={updatingId === asistente.id_inscripcion ? 'opacity-50' : ''}>
              <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>

              {/* Celdas dinámicas */}
              {orderedVisibleColumns.map((campo) => (
                <td key={campo.id_campo} className="px-4 py-2 text-sm text-gray-700">
                  {renderCellContent(asistente, campo)}
                </td>
              ))}

              <td className="px-4 py-2 text-sm">
                {updatingId === asistente.id_inscripcion ? (
                  <span className="text-gray-500 font-medium">Actualizando...</span>
                ) : (
                  asistente.estado_asistencia !== "Asistió" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onUpdateStatus(asistente.id_inscripcion, "acreditado")}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(asistente.id_inscripcion, "pendiente")}
                    >
                      Revertir
                    </Button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}