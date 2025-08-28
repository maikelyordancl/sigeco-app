"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
  FilterFn,
} from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import Cookies from 'js-cookie';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Asistente, CampoFormulario } from './types';
import { ConfigurarColumnas } from './ConfigurarColumnas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AsistentesTableProps {
  data: Asistente[];
  onEdit: (asistente: Asistente) => void;
  id_campana: string;
  camposFormulario: CampoFormulario[];
  onEstadoChange: (id_inscripcion: number, nuevoEstado: string) => void;
}

const multiWordGlobalFilter: FilterFn<Asistente> = (row, columnId, filterValue) => {
  const searchWords = String(filterValue).toLowerCase().split(' ').filter(Boolean);
  if (searchWords.length === 0) return true;
  const rowSearchableString = Object.values(row.original).join(' ').toLowerCase();
  return searchWords.every(word => rowSearchableString.includes(word));
};

const getColumnasVisiblesDesdeCookie = (id_campana: string): VisibilityState | null => {
  const cookieKey = `config_columnas_campana_${id_campana}`;
  const cookieValue = Cookies.get(cookieKey);
  if (cookieValue) {
    try {
      return JSON.parse(cookieValue);
    } catch (e) {
      console.error("Error al parsear cookie de columnas:", e);
      return null;
    }
  }
  return null;
};

const guardarColumnasVisiblesEnCookie = (id_campana: string, visibilityState: VisibilityState) => {
  const cookieKey = `config_columnas_campana_${id_campana}`;
  Cookies.set(cookieKey, JSON.stringify(visibilityState), { expires: 365 });
};

export function AsistentesTable({ data, onEdit, id_campana, camposFormulario, onEstadoChange }: AsistentesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isInitialVisibilitySet, setIsInitialVisibilitySet] = useState(false);

  // --- Mapear "#" del backend a "numero_fila"
  const dataConNumeroFila = useMemo(() => {
    return data.map(row => ({
      ...row,
      numero_fila: row['#'],
    }));
  }, [data]);

  // --- Inicializar visibilidad de columnas
  useEffect(() => {
    if (data.length > 0 && !isInitialVisibilitySet) {
      const savedVisibility = getColumnasVisiblesDesdeCookie(id_campana);
      if (savedVisibility) {
        setColumnVisibility(savedVisibility);
      } else {
        const defaultState: VisibilityState = {};
        const todasLasClaves = data.reduce((acc, row) => {
          Object.keys(row).forEach(key => acc.add(key));
          return acc;
        }, new Set<string>());

        const columnasVisiblesPorDefecto = ['numero_fila', 'nombre', 'email', 'telefono', 'empresa', 'estado_asistencia'];
        todasLasClaves.forEach(key => {
          defaultState[key] = columnasVisiblesPorDefecto.includes(key);
        });

        setColumnVisibility(defaultState);
      }
      setIsInitialVisibilitySet(true);
    }
  }, [data, id_campana, isInitialVisibilitySet]);

  useEffect(() => {
    if (isInitialVisibilitySet) {
      guardarColumnasVisiblesEnCookie(id_campana, columnVisibility);
    }
  }, [id_campana, columnVisibility, isInitialVisibilitySet]);

  // --- Columnas
  const columns = useMemo<ColumnDef<Asistente>[]>(() => {
    if (dataConNumeroFila.length === 0) return [];

    const campoEtiquetaMap = new Map(
      camposFormulario.map(campo => [campo.nombre_interno, campo.etiqueta])
    );

    const columnasPrefijo: ColumnDef<Asistente>[] = [
      {
        accessorKey: 'numero_fila',
        header: '#',
        enableHiding: false,
      },
      {
        id: 'actions',
        header: 'Editar',
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
        ),
        enableHiding: false,
      },
      { accessorKey: 'nombre', header: 'Nombre', enableHiding: false },
      { accessorKey: 'email', header: 'Email', enableHiding: false },
      { accessorKey: 'telefono', header: 'Teléfono', enableHiding: true },
      { accessorKey: 'empresa', header: 'Empresa', enableHiding: true },
    ];

    const columnaSufijo: ColumnDef<Asistente> = {
      accessorKey: 'estado_asistencia',
      header: 'Estado',
      enableHiding: false,
      cell: ({ row }) => {
        const { id_inscripcion, estado_asistencia } = row.original;
        const estados = ["Invitado", "Registrado", "Confirmado", "Por Confirmar", "No Asiste", "Asistió", "Cancelado"];
        return (
          <Select value={estado_asistencia} onValueChange={(nuevoEstado: string) => onEstadoChange(id_inscripcion, nuevoEstado)}>
            <SelectTrigger>
              <SelectValue placeholder="Cambiar estado..." />
            </SelectTrigger>
            <SelectContent>
              {estados.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      },
    };

    const todasLasClaves = dataConNumeroFila.reduce((acc, row) => {
      Object.keys(row).forEach(key => acc.add(key));
      return acc;
    }, new Set<string>());

    const clavesFijas = ['id_inscripcion', 'id_contacto', 'actions', 'nombre', 'email', 'telefono', 'empresa', 'estado_asistencia', 'nota', 'numero_fila'];

    const columnasDinamicas: ColumnDef<Asistente>[] = Array.from(todasLasClaves)
      .filter(key => !clavesFijas.includes(key) && key !== '#') // Excluir "#" para no duplicar
      .map(key => ({
        accessorKey: key,
        header: campoEtiquetaMap.get(key) || key.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase()),
      }));

    return [...columnasPrefijo, ...columnasDinamicas, columnaSufijo];

  }, [dataConNumeroFila, onEdit, camposFormulario, onEstadoChange]);

  // --- Tabla
  const table = useReactTable({
    data: dataConNumeroFila,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    globalFilterFn: multiWordGlobalFilter,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Buscar en toda la tabla..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <ConfigurarColumnas table={table} id_campana={id_campana} camposFormulario={camposFormulario} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead 
                    key={header.id} 
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.id === 'estado_asistencia' ? 'w-[200px]' : ''}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className={cell.column.id === 'estado_asistencia' ? 'w-[200px]' : ''}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
