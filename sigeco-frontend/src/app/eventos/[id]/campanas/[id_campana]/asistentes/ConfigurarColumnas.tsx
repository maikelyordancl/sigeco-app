"use client";

import React, { useState, useMemo } from 'react';
// --- CORRECCIÓN: Añadir 'VisibilityState' a la importación ---
import { Table, VisibilityState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import ConfigurarColumnasDialog from './ConfigurarColumnasDialog';
import { CampoFormulario } from './types';

interface ConfigurarColumnasProps<TData> {
    table: Table<TData>;
    id_campana: string;
    camposFormulario: CampoFormulario[];
}

export function ConfigurarColumnas<TData>({ table, id_campana, camposFormulario }: ConfigurarColumnasProps<TData>) {
    const [isDialogOpen, setDialogOpen] = useState(false);

    const columnasConfigurables = useMemo(() => {
        return table.getAllLeafColumns().filter(column => column.getCanHide());
    }, [table.getAllLeafColumns]);

    const columnasVisibles = useMemo(() => {
        return table.getVisibleLeafColumns().map(c => c.id);
    }, [table.getState().columnVisibility]);


    const handleGuardarColumnas = (nombresColumnas: string[]) => {
        table.setColumnVisibility(
            columnasConfigurables.reduce((acc, col) => {
                acc[col.id] = nombresColumnas.includes(col.id);
                return acc;
            }, {} as VisibilityState)
        );
    };

    return (
        <>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Alternar Columnas
            </Button>
            <ConfigurarColumnasDialog
                isOpen={isDialogOpen}
                onClose={() => setDialogOpen(false)}
                columnasDisponibles={columnasConfigurables.map(c => c.id)}
                columnasSeleccionadas={columnasVisibles}
                onGuardarColumnas={handleGuardarColumnas}
                camposFormulario={camposFormulario}
            />
        </>
    );
}