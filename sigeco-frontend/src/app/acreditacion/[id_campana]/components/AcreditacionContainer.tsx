"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { Asistente, CampoFormulario } from "../types";
import { AcreditacionTable } from "./AcreditacionTable";
import { ConfigureColumnsAcreditacion } from "./ConfigureColumnsAcreditacion";
import { useVisibleColumns } from "./useVisibleColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Search, X } from "lucide-react";
import { QRScannerDialog } from "./QRScannerDialog";

type FiltroEstado = "todos" | "acreditados" | "no_acreditados" | "pagados";

interface AcreditacionContainerProps {
  asistentes: Asistente[];
  camposFormulario: CampoFormulario[];
  onUpdateStatus: (
    id_inscripcion: number,
    estado: "acreditado" | "denegado" | "pendiente"
  ) => void;
  updatingId?: number | null;
  filtroEstado: FiltroEstado;
  onFiltroChange: (filtro: FiltroEstado) => void;
  externalSearchTerm?: string;
  onSearchTermChange?: (value: string) => void;
}

export default function AcreditacionContainer({
  asistentes,
  camposFormulario,
  onUpdateStatus,
  updatingId,
  filtroEstado,
  onFiltroChange,
  externalSearchTerm,
  onSearchTermChange,
}: AcreditacionContainerProps) {
  const params = useParams();
  const id_campana = String(params.id_campana || "");

  const { visibleColumns, toggleColumnVisibility } = useVisibleColumns(
    camposFormulario,
    id_campana
  );

  const [searchTerm, setSearchTerm] = useState(externalSearchTerm ?? "");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const hasPaymentColumn = camposFormulario.some(
    (c) => c.nombre_interno === "estado_pago"
  );

  useEffect(() => {
    if (typeof externalSearchTerm === "string" && externalSearchTerm !== searchTerm) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm, searchTerm]);

  const handleScan = (scannedId: string) => {
    setIsScannerOpen(false);
    handleSearchTermChange(scannedId);
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    onSearchTermChange?.(value);
  };

  const filteredAsistentes = useMemo(() => {
    if (!searchTerm) {
      return asistentes;
    }

    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    return asistentes.filter((asistente) => {
      if (String(asistente.id_inscripcion) === lowerSearchTerm) {
        return true;
      }

      const textFields = ["nombre", "email", "rut", "empresa", "telefono"];
      for (const field of textFields) {
        const value = (asistente as any)[field];
        if (typeof value === "string" && value.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
      }

      return false;
    });
  }, [asistentes, searchTerm]);

  const handleUpdateStatusWithSearch = (
    id_inscripcion: number,
    estado: "acreditado" | "denegado" | "pendiente"
  ) => {
    if (estado === "acreditado") {
      const asistente = asistentes.find((a) => a.id_inscripcion === id_inscripcion);

      if (asistente) {
        const nombre = [
          (asistente as any).nombre,
          (asistente as any).apellido,
          (asistente as any).apellido_paterno,
          (asistente as any).apellido_materno,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        const textoBusqueda =
          ((asistente as any).email as string) ||
          nombre ||
          String(asistente.id_inscripcion);

        handleSearchTermChange(textoBusqueda);
      }
    }

    onUpdateStatus(id_inscripcion, estado);
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg flex-wrap">
          <Button
            variant={filtroEstado === "todos" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFiltroChange("todos")}
          >
            Todos
          </Button>

          <Button
            variant={filtroEstado === "acreditados" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFiltroChange("acreditados")}
            className={filtroEstado === "acreditados" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Acreditados
          </Button>

          <Button
            variant={filtroEstado === "no_acreditados" ? "default" : "ghost"}
            size="sm"
            onClick={() => onFiltroChange("no_acreditados")}
            className={filtroEstado === "no_acreditados" ? "bg-gray-700 hover:bg-gray-800" : ""}
          >
            No Acreditados
          </Button>

          {hasPaymentColumn && (
            <Button
              variant={filtroEstado === "pagados" ? "default" : "ghost"}
              size="sm"
              onClick={() => onFiltroChange("pagados")}
              className={filtroEstado === "pagados" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Pagados
            </Button>
          )}
        </div>

        <div className="flex-grow flex items-center justify-end gap-2">
          <div className="relative flex-grow max-w-lg">
            <Input
              placeholder="Buscar por nombre, email, rut o ID..."
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              className="pl-10 pr-10"
            />

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

            {searchTerm.trim().length > 0 && (
              <button
                type="button"
                onClick={() => handleSearchTermChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Limpiar búsqueda"
                title="Limpiar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => setIsScannerOpen(true)}
          >
            <Camera className="h-5 w-5" />
            <span className="sr-only">Escanear QR</span>
          </Button>

          <ConfigureColumnsAcreditacion
            camposFormulario={camposFormulario}
            visibleColumns={visibleColumns}
            toggleColumnVisibility={toggleColumnVisibility}
          />
        </div>
      </div>

      <div className="relative">
        <AcreditacionTable
          asistentes={filteredAsistentes}
          camposFormulario={camposFormulario}
          visibleColumns={visibleColumns}
          onUpdateStatus={handleUpdateStatusWithSearch}
          updatingId={updatingId}
        />

        {updatingId !== null && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
            <p className="text-xl font-bold text-gray-700">Actualizando...</p>
          </div>
        )}
      </div>

      <QRScannerDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
}