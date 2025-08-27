"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CampoFormulario } from "./types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    columnasDisponibles: string[];
    columnasSeleccionadas: string[];
    onGuardarColumnas: (columnas: string[]) => void;
    camposFormulario: CampoFormulario[];
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

const ConfigurarColumnasDialog = ({ isOpen, onClose, columnasDisponibles, columnasSeleccionadas, onGuardarColumnas, camposFormulario }: Props) => {
    const [selection, setSelection] = useState<string[]>(columnasSeleccionadas);

    const campoEtiquetaMap = useMemo(() => 
        new Map(camposFormulario.map(campo => [campo.nombre_interno, campo.etiqueta]))
    , [camposFormulario]);

    useEffect(() => {
        if(isOpen) {
            setSelection(columnasSeleccionadas);
        }
    }, [isOpen, columnasSeleccionadas]);

    const handleToggle = (columna: string) => {
        setSelection(prev =>
            prev.includes(columna) ? prev.filter(c => c !== columna) : [...prev, columna]
        );
    };

    const handleSave = () => {
        onGuardarColumnas(selection);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* --- MODIFICACIÓN: Ajustado a 60vh --- */}
            <DialogContent className="h-[60vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Configurar Columnas Visibles</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto space-y-3 pr-4">
                    <p className="text-sm text-gray-600">Selecciona los campos que deseas ver en la tabla.</p>
                    {columnasDisponibles.map(columna => (
                        <div key={columna} className="flex items-center space-x-2">
                            <Checkbox
                                id={`col-${columna}`}
                                checked={selection.includes(columna)}
                                onCheckedChange={() => handleToggle(columna)}
                            />
                            <Label htmlFor={`col-${columna}`} className="cursor-pointer">
                                {
                                    campoEtiquetaMap.get(columna)
                                    || capitalizar(columna.replace(/_/g, ' '))
                                }
                            </Label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfigurarColumnasDialog;