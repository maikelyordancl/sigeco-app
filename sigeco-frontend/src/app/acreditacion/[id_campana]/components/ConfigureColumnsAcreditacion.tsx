"use client";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  toggleColumnVisibility
}: ConfigureColumnsProps) {

  // Columnas que no se pueden ocultar
  const unhideableColumns = ['nombre', 'email'];

  // Campos de sistema que sí queremos que se puedan configurar (mostrar/ocultar)
  const configurableSystemFields = [
    'rut',
    'empresa',
    'actividad',
    'profesion',
    'pais',
    'comuna', // <-- ¡Añadido aquí!
    'estado_asistencia'
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          Configurar Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Campos Visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {camposFormulario
          .filter(campo => !campo.es_de_sistema || configurableSystemFields.includes(campo.nombre_interno) || unhideableColumns.includes(campo.nombre_interno))
          .map(campo => (
          <DropdownMenuCheckboxItem
            key={campo.id_campo}
            checked={visibleColumns.includes(campo.nombre_interno)}
            onCheckedChange={() => toggleColumnVisibility(campo.nombre_interno)}
            disabled={unhideableColumns.includes(campo.nombre_interno)}
          >
            {campo.etiqueta}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}