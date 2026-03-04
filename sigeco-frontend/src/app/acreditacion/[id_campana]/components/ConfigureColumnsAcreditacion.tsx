"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { CampoFormulario } from "../types";

interface ConfigureColumnsProps {
  camposFormulario: CampoFormulario[];
  visibleColumns: string[];
  toggleColumnVisibility: (nombre_interno: string) => void;
}

export function ConfigureColumnsAcreditacion({
  camposFormulario,
  visibleColumns,
  toggleColumnVisibility,
}: ConfigureColumnsProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [open]);

  const unhideableColumns = ["nombre", "email", "nivel", "estado_acreditacion"];

  const configurableSystemFields = [
  "rut",
  "empresa",
  "actividad",
  "profesion",
  "pais",
  "comuna",
  "fecha_acreditacion",
  "fecha_creacion_contacto",
  "estado_pago",
  "monto_pagado_actual",
];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          Configurar Columnas
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        ref={contentRef}
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16 as unknown as number}
        style={{
          maxHeight: "min(calc(100vh - 2rem), var(--radix-popper-available-height))",
        }}
        className="w-80 overflow-y-auto overflow-x-hidden p-0"
        onWheelCapture={(e) => e.stopPropagation()}
        onTouchMoveCapture={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-popover">
          <DropdownMenuLabel className="px-2 py-2">
            Campos Visibles
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
        </div>

        <div className="p-1">
          {camposFormulario
            .filter(
              (campo) =>
                !campo.es_de_sistema ||
                configurableSystemFields.includes(campo.nombre_interno) ||
                unhideableColumns.includes(campo.nombre_interno)
            )
            .map((campo) => (
              <DropdownMenuCheckboxItem
                key={campo.id_campo}
                checked={visibleColumns.includes(campo.nombre_interno)}
                onCheckedChange={() => toggleColumnVisibility(campo.nombre_interno)}
                disabled={unhideableColumns.includes(campo.nombre_interno)}
              >
                {campo.etiqueta}
              </DropdownMenuCheckboxItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}