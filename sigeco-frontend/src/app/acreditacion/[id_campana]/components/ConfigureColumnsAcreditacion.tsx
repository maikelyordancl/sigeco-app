"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampoFormulario } from "../types";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";

interface Props {
  campos: CampoFormulario[];
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
}

export function ConfigureColumnsAcreditacion({
  campos,
  visibleColumns,
  setVisibleColumns,
}: Props) {
  const toggleColumn = (columnName: string) => {
    let newVisibleColumns: string[];

    if (visibleColumns.includes(columnName)) {
      // Quitar columna
      newVisibleColumns = visibleColumns.filter((col) => col !== columnName);
    } else {
      // Añadir columna manteniendo el orden original según `campos`
      newVisibleColumns = [
        ...visibleColumns,
        columnName,
      ].sort(
        (a, b) =>
          campos.findIndex((c) => c.nombre_interno === a) -
          campos.findIndex((c) => c.nombre_interno === b)
      );
    }

    setVisibleColumns(newVisibleColumns);
    // Guardar en localStorage usando la primera columna como referencia de campaña (coherente con page.tsx)
    localStorage.setItem(
      `visible_columns_campana_${campos[0]?.id_campo || ""}`,
      JSON.stringify(newVisibleColumns)
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" /> Alternar Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Seleccionar Columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {campos.map((campo) => (
          <DropdownMenuCheckboxItem
            key={campo.id_campo}
            className="capitalize"
            checked={visibleColumns.includes(campo.nombre_interno)}
            onCheckedChange={() => toggleColumn(campo.nombre_interno)}
          >
            {campo.etiqueta}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
