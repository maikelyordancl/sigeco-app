"use client";

import React, { useState } from 'react'; // CORRECCIÓN AQUÍ
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash } from "lucide-react";
import { Contacto } from "../types/contacto";

interface ContactosTableProps {
  contactos: Contacto[];
  selectedContactos: number[];
  onSelectContacto: (id: number) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (contacto: Contacto) => void;
  onDelete: (contacto: Contacto) => void;
}

export const ContactosTable: React.FC<ContactosTableProps> = ({
  contactos,
  selectedContactos,
  onSelectContacto,
  onSelectAll,
  onEdit,
  onDelete,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Contacto>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            onSelectAll(!!value);
          }}
          aria-label="Seleccionar todo"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            onSelectContacto(row.original.id_contacto);
          }}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
        </Button>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
    },
    {
      accessorKey: "empresa",
      header: "Empresa",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(row.original)}
          >
            <Trash size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: contactos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      rowSelection: contactos.reduce((acc, contacto) => {
        acc[contacto.id_contacto] = selectedContactos.includes(contacto.id_contacto);
        return acc;
      }, {} as Record<string, boolean>),
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.original.id_contacto}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No se encontraron resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};