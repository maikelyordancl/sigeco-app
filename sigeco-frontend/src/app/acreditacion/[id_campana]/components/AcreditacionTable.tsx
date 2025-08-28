"use client";

import { Asistente, CampoFormulario } from "../types";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";

interface AcreditacionTableProps {
  asistentes: Asistente[];
  campos: CampoFormulario[];
  visibleColumns: string[];
  onUpdateStatus: (id_inscripcion: number, nuevo_estado: 'Asistió' | 'Cancelado' | 'Confirmado') => void;
  updatingId?: number | null;
}

export default function AcreditacionTable({
  asistentes,
  campos,
  visibleColumns,
  onUpdateStatus,
  updatingId
}: AcreditacionTableProps) {
  if (!asistentes.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        No hay asistentes registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>

            {campos
              .filter((campo) => visibleColumns.includes(campo.nombre_interno))
              .map((campo) => (
                <th
                  key={campo.id_campo}
                  className="px-4 py-2 text-left text-sm font-semibold text-gray-700"
                >
                  {campo.etiqueta}
                </th>
              ))}

            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Estado</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Acción</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {asistentes.map((asistente, index) => (
            <tr key={asistente.id_inscripcion}>
              <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>

              {campos
                .filter((campo) => visibleColumns.includes(campo.nombre_interno))
                .map((campo) => (
                  <td
                    key={`${asistente.id_inscripcion}-${campo.id_campo}`}
                    className="px-4 py-2 text-sm text-gray-700"
                  >
                    {asistente[campo.nombre_interno] ?? "-"}
                  </td>
                ))}

              <td className="px-4 py-2 text-sm">
                {asistente.estado_asistencia === "Asistió" ? (
                  <span className="inline-flex items-center text-green-600 font-medium">
                    <BadgeCheck className="w-4 h-4 mr-1" /> Asistió
                  </span>
                ) : asistente.estado_asistencia === "Cancelado" ? (
                  <span className="text-red-600 font-medium">Denegado</span>
                ) : (
                  <span className="text-gray-500">Pendiente</span>
                )}
              </td>

              <td className="px-4 py-2 text-sm">
                {asistente.estado_asistencia !== "Asistió" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onUpdateStatus(asistente.id_inscripcion, "Asistió")}
                    >
                      Acreditar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onUpdateStatus(asistente.id_inscripcion, "Cancelado")}
                    >
                      Denegar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateStatus(asistente.id_inscripcion, "Confirmado")}
                  >
                    Revertir
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
