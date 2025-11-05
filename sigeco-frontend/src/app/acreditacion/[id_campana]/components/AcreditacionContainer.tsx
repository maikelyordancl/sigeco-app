// sigeco-frontend/src/app/acreditacion/[id_campana]/components/AcreditacionContainer.tsx
"use client";

// --- NUEVA MODIFICACIÓN: Importar React hooks, Input y los iconos ---
import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Asistente, CampoFormulario, TipoCampo } from '../types';
import { AcreditacionTable } from './AcreditacionTable';
import { ConfigureColumnsAcreditacion } from './ConfigureColumnsAcreditacion';
import { useVisibleColumns } from './useVisibleColumns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Search } from 'lucide-react';
import { QRScannerDialog } from './QRScannerDialog'; // El componente que creaste
// --- FIN NUEVA MODIFICACIÓN ---

// 2. Definir el tipo de filtro (opcional, pero buena práctica)
type FiltroEstado = 'todos' | 'acreditados' | 'no_acreditados';

interface AcreditacionContainerProps {
  asistentes: Asistente[];
  camposFormulario: CampoFormulario[];
  onUpdateStatus: (id_inscripcion: number, estado: 'acreditado' | 'denegado' | 'pendiente') => void;
  updatingId?: number | null;
  // 3. Añadir los nuevos props a la interfaz
  filtroEstado: FiltroEstado;
  onFiltroChange: (filtro: FiltroEstado) => void;
}

export default function AcreditacionContainer({
  asistentes,
  camposFormulario,
  onUpdateStatus,
  updatingId,
  // 4. Recibir los nuevos props
  filtroEstado,
  onFiltroChange,
}: AcreditacionContainerProps) {
  const params = useParams();
  const id_campana = String(params.id_campana || '');

  const { visibleColumns, toggleColumnVisibility } = useVisibleColumns(camposFormulario, id_campana);

  // Verificamos si existen campos personalizados visibles para mostrar el botón
  const customFieldsExist = camposFormulario.some(c => !c.es_de_sistema);

  // --- NUEVA MODIFICACIÓN: Estados para el buscador y el escáner ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  // --- FIN NUEVA MODIFICACIÓN ---

  // --- NUEVA MODIFICACIÓN: Lógica del escáner ---
  const handleScan = (scannedId: string) => {
    // 1. Cerramos el diálogo
    setIsScannerOpen(false);
    // 2. Ponemos el ID en el buscador
    setSearchTerm(scannedId);
    // Nota: El filtrado se hará automáticamente por el 'useMemo' de abajo
  };
  // --- FIN NUEVA MODIFICACIÓN ---

  // --- NUEVA MODIFICACIÓN: Lógica de filtrado ---
  // Filtramos los asistentes localmente basados en el buscador
  const filteredAsistentes = useMemo(() => {
    if (!searchTerm) {
      return asistentes; // Retorna la lista (ya filtrada por estado desde el 'page.tsx')
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    
    return asistentes.filter((asistente) => {
      // Comprobar ID de inscripción (coincidencia exacta)
      if (String(asistente.id_inscripcion) === lowerSearchTerm) {
        return true;
      }

      // Comprobar campos de texto
      // (Buscamos en 'nombre', 'email', 'rut', etc.)
      const textFields = ['nombre', 'email', 'rut', 'empresa', 'telefono'];
      for (const field of textFields) {
        const value = (asistente as any)[field];
        if (typeof value === 'string' && value.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
      }
      return false;
    });
  }, [asistentes, searchTerm]);
  // --- FIN NUEVA MODIFICACIÓN ---


  return (
    <div>
      {/* 5. Modificar este div para incluir los filtros Y el buscador */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        
        {/* Grupo de filtros de estado */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={filtroEstado === 'todos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFiltroChange('todos')}
          >
            Todos
          </Button>
          <Button
            variant={filtroEstado === 'acreditados' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFiltroChange('acreditados')}
            className={filtroEstado === 'acreditados' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Acreditados
          </Button>
          <Button
            variant={filtroEstado === 'no_acreditados' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFiltroChange('no_acreditados')}
            className={filtroEstado === 'no_acreditados' ? 'bg-gray-700 hover:bg-gray-800' : ''}
          >
            No Acreditados
          </Button>
        </div>

        {/* --- NUEVA MODIFICACIÓN: Buscador y botón de cámara --- */}
        <div className="flex-grow flex items-center justify-end gap-2">
          <div className="relative flex-grow max-w-lg">
            <Input
              placeholder="Buscar por nombre, email, rut o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0" // Asegura misma altura que Input
            onClick={() => setIsScannerOpen(true)}
          >
            <Camera className="h-5 w-5" />
            <span className="sr-only">Escanear QR</span>
          </Button>
        {/* --- FIN NUEVA MODIFICACIÓN --- */}

          {/* Botón de configurar columnas */}
          {customFieldsExist && (
            <ConfigureColumnsAcreditacion
              camposFormulario={camposFormulario}
              visibleColumns={visibleColumns}
              toggleColumnVisibility={toggleColumnVisibility}
            />
          )}
        </div>
      </div>
      {/* --- FIN DE LA MODIFICACIÓN --- */}


      <div className="relative">
        <AcreditacionTable
          // --- NUEVA MODIFICACIÓN: Usar la lista filtrada ---
          asistentes={filteredAsistentes}
          // --- FIN NUEVA MODIFICACIÓN ---
          camposFormulario={camposFormulario}
          visibleColumns={visibleColumns}
          onUpdateStatus={onUpdateStatus}
          updatingId={updatingId}
        />

        {updatingId !== null && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
            <p className="text-xl font-bold text-gray-700">Actualizando...</p>
          </div>
        )}
      </div>

      {/* --- NUEVA MODIFICACIÓN: Añadir el diálogo del escáner --- */}
      <QRScannerDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
      {/* --- FIN NUEVA MODIFICACIÓN --- */}
    </div>
  );
}