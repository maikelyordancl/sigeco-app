"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  ColumnDef, flexRender, getCoreRowModel, getSortedRowModel,
  useReactTable, SortingState, VisibilityState
} from '@tanstack/react-table';
import { Pencil, Trash, UserPlus } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Asistente, CampoFormulario, EstadoAsistencia } from './types';
import { ConfigurarColumnas } from './ConfigurarColumnas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import RegistrarEnPuertaDialog from '@/app/acreditacion/[id_campana]/components/RegistrarEnPuertaDialog';

interface AsistentesTableProps {
  data: Asistente[];
  onEdit: (asistente: Asistente) => void;
  id_campana: string;
  camposFormulario: CampoFormulario[];
  onEstadoChange: (id_inscripcion: number, nuevoEstado: EstadoAsistencia) => void | Promise<void>;
  limit: number;
  onLimitChange: (n: number) => void;
  page: number;
  totalPages: number;
  totalInscripciones: number;
  onPageChange: (newPage: number) => void;
  statusCounts: Record<string, number>;
  onRefreshData: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  estadoFiltro: string;
  onEstadoFiltroChange: (value: string) => void;
  isRefreshing: boolean;
}

const PaginationControls = ({ page, totalPages, totalInscripciones, limit, onPageChange }: any) => (
  <div className="flex items-center justify-between space-x-2 py-4">
    <div className="text-sm text-muted-foreground">
      {totalInscripciones > 0
        ? `Mostrando ${Math.min((page - 1) * limit + 1, totalInscripciones)} a ${Math.min(page * limit, totalInscripciones)} de ${totalInscripciones} inscripciones`
        : "No hay inscripciones para mostrar"
      }
    </div>
    <div className="space-x-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Anterior</Button>
      <span className="px-2 text-sm">Página {page} de {totalPages > 0 ? totalPages : 1}</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Siguiente</Button>
    </div>
  </div>
);

const getColumnasVisiblesDesdeCookie = (id_campana: string): VisibilityState | null => {
  const cookieKey = `config_columnas_campana_${id_campana}`;
  const cookieValue = Cookies.get(cookieKey);
  if (cookieValue) { try { return JSON.parse(cookieValue); } catch (e) { console.error("Error parsing column cookie:", e); return null; } }
  return null;
};

const guardarColumnasVisiblesEnCookie = (id_campana: string, visibilityState: VisibilityState) => {
  const cookieKey = `config_columnas_campana_${id_campana}`;
  Cookies.set(cookieKey, JSON.stringify(visibilityState), { expires: 365 });
};

const ESTADOS: EstadoAsistencia[] = ["Invitado", "Abrio Email", "Registrado", "Confirmado", "Por Confirmar", "Asistió", "No Asiste", "Cancelado"];
const ALL = "__ALL__";
type EstadoStyle = { bg: string; text: string; border: string; dot: string; rowBorder: string; };
const ESTILO_DEFAULT: EstadoStyle = { bg: 'bg-muted dark:bg-muted/40', text: 'text-foreground dark:text-foreground', border: 'border-gray-300 dark:border-gray-800', dot: 'bg-gray-400 dark:bg-gray-500', rowBorder: 'border-l-gray-300 dark:border-l-gray-700' };
const ESTADO_STYLES: Record<string, EstadoStyle> = {
  "Invitado": { bg: 'bg-slate-50 dark:bg-slate-900/60', text: 'text-slate-700 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-800', dot: 'bg-slate-500', rowBorder: 'border-l-slate-400 dark:border-l-slate-600' },
  "Abrio Email": { bg: 'bg-amber-50 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500', rowBorder: 'border-l-amber-400 dark:border-l-amber-600' },
  "Registrado": { bg: 'bg-sky-50 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-200', border: 'border-sky-200 dark:border-sky-800', dot: 'bg-sky-500', rowBorder: 'border-l-sky-400 dark:border-l-sky-600' },
  "Confirmado": { bg: 'bg-indigo-50 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-200', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500', rowBorder: 'border-l-indigo-400 dark:border-l-indigo-600' },
  "Por Confirmar": { bg: 'bg-yellow-50 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500', rowBorder: 'border-l-yellow-400 dark:border-l-yellow-600' },
  "No Asiste": { bg: 'bg-red-50 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-200', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500', rowBorder: 'border-l-red-400 dark:border-l-red-600' },
  "Asistió": { bg: 'bg-emerald-50 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-200', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', rowBorder: 'border-l-emerald-400 dark:border-l-emerald-600' },
  "Cancelado": { bg: 'bg-zinc-50 dark:bg-zinc-900/40', text: 'text-zinc-700 dark:text-zinc-200', border: 'border-zinc-200 dark:border-zinc-800', dot: 'bg-zinc-500', rowBorder: 'border-l-zinc-400 dark:border-l-zinc-600' },
};
const getEstadoStyle = (estado?: string): EstadoStyle => estado ? (ESTADO_STYLES[estado] ?? ESTILO_DEFAULT) : ESTILO_DEFAULT;

export function AsistentesTable({
  data, onEdit, id_campana, camposFormulario, onEstadoChange,
  limit, onLimitChange, page, totalPages, totalInscripciones, onPageChange,
  statusCounts, onRefreshData,
  searchTerm, onSearchChange, estadoFiltro, onEstadoFiltroChange,
  isRefreshing
}: AsistentesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isInitialVisibilitySet, setIsInitialVisibilitySet] = useState(false);
  const [dataState, setDataState] = useState<Asistente[]>(Array.isArray(data) ? data : []);
  
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setDataState(Array.isArray(data) ? data : []); }, [data]);
  
  const dataConNumeroFila = useMemo(() => {
    return (Array.isArray(dataState) ? dataState : []).map(row => ({ ...row, numero_fila: (row as any)['#'] }));
  }, [dataState]);

  useEffect(() => {
    if (dataState.length > 0 && !isInitialVisibilitySet) {
      const savedVisibility = getColumnasVisiblesDesdeCookie(id_campana);
      if (savedVisibility) {
        setColumnVisibility(savedVisibility);
      } else {
        const defaultState: VisibilityState = {};
        const todasLasClaves = dataState.reduce((acc, row) => {
          Object.keys(row).forEach(key => acc.add(key));
          return acc;
        }, new Set<string>());
        todasLasClaves.add('numero_fila');
        const colsVisiblesDefault = ['numero_fila', 'nombre', 'email', 'telefono', 'empresa', 'estado_asistencia'];
        todasLasClaves.forEach(key => { defaultState[key] = colsVisiblesDefault.includes(key); });
        setColumnVisibility(defaultState);
      }
      setIsInitialVisibilitySet(true);
    }
  }, [dataState, id_campana, isInitialVisibilitySet]);

  useEffect(() => {
    if (isInitialVisibilitySet) { guardarColumnasVisiblesEnCookie(id_campana, columnVisibility); }
  }, [id_campana, columnVisibility, isInitialVisibilitySet]);

  const handleDelete = async (id_inscripcion: number) => {
    try {
      const res = await apiFetch(`/campanas/asistentes/${id_inscripcion}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setDataState(prev => prev.filter(a => a.id_inscripcion !== id_inscripcion));
      toast.success('Inscripción eliminada');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar la inscripción');
    }
  };

  const handleEstadoLocalChange = async (id_inscripcion: number, nuevoEstado: EstadoAsistencia) => {
    const prevData = dataState;
    setDataState(old =>
      old.map(a =>
        a.id_inscripcion === id_inscripcion ? { ...a, estado_asistencia: nuevoEstado } : a
      )
    );
    try {
      const promise = onEstadoChange?.(id_inscripcion, nuevoEstado);
      if (promise && typeof promise.then === 'function') { await promise; }
    } catch (err) {
      setDataState(prevData);
      console.error(err);
    }
  };

  const handleRegistrarSubmit = async (formData: any) => {
  setIsSubmitting(true);
  const toastId = toast.loading('Registrando asistente...');
  try {
    const sanitized = {
      ...formData,
      acreditar: false,
      acreditar_inmediatamente: false,
      acreditacion_inmediata: false,
    };
    delete (sanitized as any).acreditar;
    delete (sanitized as any).acreditar_inmediatamente;
    delete (sanitized as any).acreditacion_inmediata;

    const response = await apiFetch(`/acreditacion/registrar-en-puerta/${id_campana}`, {
      method: 'POST',
      body: JSON.stringify(sanitized),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || errorData?.message || 'Error al registrar la inscripción.');
    }

    toast.success('Asistente registrado con éxito!', { id: toastId });
    setIsRegistrarOpen(false);
    onRefreshData();
  } catch (error: any) {
    toast.error(error?.message || 'No se pudo registrar al asistente.', { id: toastId });
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};

  const columns = useMemo<ColumnDef<Asistente>[]>(() => {
    if (dataState.length === 0) return [];
    
    const campoEtiquetaMap = new Map(camposFormulario.map(c => [c.nombre_interno, c.etiqueta]));
    
    const colsPrefijo: ColumnDef<Asistente>[] = [
      { accessorKey: 'numero_fila', header: '#', enableHiding: false },
      { 
        id: 'actions', 
        header: 'Editar', 
        enableHiding: false, 
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="icon" className="bg-amber-500 hover:bg-amber-600" onClick={() => onEdit(row.original)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="destructive" onClick={() => { if (window.confirm(`¿Seguro que deseas eliminar a "${row.original.nombre}"?`)) { handleDelete(row.original.id_inscripcion); } }}><Trash className="h-4 w-4" /></Button>
          </div>
        )
      },
      { accessorKey: 'nombre', header: 'Nombre', enableHiding: false, cell: ({ row }) => <span className="uppercase">{row.original.nombre}</span> },
      { accessorKey: 'email', header: 'Email', enableHiding: false }, 
      { accessorKey: 'telefono', header: 'Teléfono', enableHiding: true }, 
      { accessorKey: 'empresa', header: 'Empresa', enableHiding: true },
    ];

    const colSufijo: ColumnDef<Asistente> = { 
      accessorKey: 'estado_asistencia', 
      header: 'Estado', 
      enableHiding: false, 
      cell: ({ row }) => {
        const { id_inscripcion, estado_asistencia } = row.original;
        const estilos = getEstadoStyle(estado_asistencia);
        return (
          <div className="flex justify-center">
            <Select
              value={estado_asistencia}
              onValueChange={(nuevo) => handleEstadoLocalChange(id_inscripcion, nuevo as EstadoAsistencia)}
            >
              <SelectTrigger className={`h-8 w-[200px] ${estilos.bg} ${estilos.text} border ${estilos.border}`}><SelectValue/></SelectTrigger>
              <SelectContent>
                {ESTADOS.map(e => (
                  <SelectItem key={e} value={e}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${getEstadoStyle(e).dot}`} />
                      {e}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
    };

    const todasLasClaves = dataState.reduce((acc, row) => { 
      Object.keys(row).forEach(key => acc.add(key)); 
      return acc; 
    }, new Set<string>());
    
    todasLasClaves.add('numero_fila');
    
    const clavesFijas = ['id_contacto', 'actions', 'nombre', 'email', 'telefono', 'empresa', 'estado_asistencia', 'nota', 'numero_fila'];
    
    const colsDinamicas: ColumnDef<Asistente>[] = Array.from(todasLasClaves)
      .filter(key => !clavesFijas.includes(key) && key !== '#')
      .map(key => ({
        accessorKey: key,
        header: campoEtiquetaMap.get(key) || key.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase()),
        cell: ({ row }) => {
          let valor = row.original[key];
          if (typeof valor === "string" && valor.trim().startsWith("[") && valor.trim().endsWith("]")) {
            try {
              const arr = JSON.parse(valor);
              if (Array.isArray(arr)) {
                valor = arr.join(", ");
              }
            } catch {}
          }
          return <span>{valor}</span>;
        }
      }));

    return [...colsPrefijo, ...colsDinamicas, colSufijo];
  }, [dataState, onEdit, camposFormulario, onEstadoChange]);
  
  const table = useReactTable({
    data: dataConNumeroFila, columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility, 
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const estiloFiltro = estadoFiltro === ALL ? ESTILO_DEFAULT : getEstadoStyle(estadoFiltro as string);
  const paginationProps = { page, totalPages, totalInscripciones, limit, onPageChange };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="relative max-w-sm">
  <span className="absolute inset-y-0 left-0 pl-2 text-yellow-600">🔍</span>
  <Input
    placeholder="Buscar..."
    value={searchTerm}
    onChange={e => onSearchChange(e.target.value)}
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se elimina la propiedad `disabled`
    // --- FIN DE LA MODIFICACIÓN ---
    className="pl-8 bg-yellow-200 focus:bg-yellow-100 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-400 shadow-md"
  />
</div>

        <div className="justify-self-center">
          <p>Filtros: </p>
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          {/* Se elimina la propiedad `disabled` */}
          <Select value={estadoFiltro} onValueChange={onEstadoFiltroChange}>
          {/* --- FIN DE LA MODIFICACIÓN --- */}
            <SelectTrigger className={`w-[220px] border-2 border-cyan-500 shadow-md ${estiloFiltro.bg} ${estiloFiltro.text}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${ESTILO_DEFAULT.dot}`} />
                  Todos ({totalInscripciones})
                </div>
              </SelectItem>
              {ESTADOS.map(e => (
                <SelectItem key={e} value={e}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${getEstadoStyle(e).dot}`} />
                    {e} ({statusCounts[e] || 0})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:justify-self-end flex items-center gap-3">
            <ConfigurarColumnas table={table} id_campana={id_campana} camposFormulario={camposFormulario} />

            <Button onClick={() => setIsRegistrarOpen(true)} className="bg-cyan-600 hover:bg-cyan-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Registro
            </Button>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Registros:</span>
                <Select value={String(limit)} onValueChange={v => onLimitChange(parseInt(v, 10))}>
                    <SelectTrigger className="w-[120px] border-2 border-cyan-500 shadow-md"><SelectValue /></SelectTrigger>
                    <SelectContent>{[25, 50, 100, 200, 300, 500, 1000].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>

        <div className="mt-2 md:col-start-2 md:col-end-3 justify-self-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
            {["Confirmado", "Asistió", "Registrado", "Por Confirmar", "Abrio Email", "No Asiste", "Invitado", "Cancelado"].map((e) => {
                const s = getEstadoStyle(e);
                const count = statusCounts[e] || 0;
                return (
                <span key={e} className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border ${s.bg} ${s.text} ${s.border}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    {e} <span className="font-bold">({count})</span>
                </span>
                );
            })}
            </div>
        </div>
      </div>
      
      <RegistrarEnPuertaDialog
        isOpen={isRegistrarOpen}
        onClose={() => setIsRegistrarOpen(false)}
        id_campana={id_campana}
        formConfig={camposFormulario}
        onSubmit={handleRegistrarSubmit}
        isSubmitting={isSubmitting}
        showAcreditarToggle={false}
      />

      <PaginationControls {...paginationProps} />
      <div className="rounded-md border relative">
        {isRefreshing && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10" />}
        <Table>
          <TableHeader><TableRow className="bg-cyan-400">{table.getHeaderGroups().map(hg => hg.headers.map(h => <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()} className="font-bold text-black !bg-cyan-400 hover:!bg-cyan-400">{flexRender(h.column.columnDef.header, h.getContext())}{{asc:'🔼',desc:'🔽'}[h.column.getIsSorted() as string]??null}</TableHead>))}</TableRow></TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => {
                const estiloFila = getEstadoStyle((row.original as Asistente).estado_asistencia);
                return (<TableRow key={row.id} className={`border-l-4 ${estiloFila.rowBorder}`}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>);
              })
            ) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No hay resultados.</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
      <PaginationControls {...paginationProps} />
    </div>
  );
}