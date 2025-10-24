"use client";

import { useParams } from 'next/navigation';
import { Asistente, CampoFormulario, TipoCampo } from '../types';
import { AcreditacionTable } from './AcreditacionTable';
import { ConfigureColumnsAcreditacion } from './ConfigureColumnsAcreditacion';
import { useVisibleColumns } from './useVisibleColumns';
// --- INICIO DE LA MODIFICACIÓN ---
// 1. Importar Button
import { Button } from '@/components/ui/button';
// --- FIN DE LA MODIFICACIÓN ---

// --- INICIO DE LA MODIFICACIÓN ---
// 2. Definir el tipo de filtro (opcional, pero buena práctica)
type FiltroEstado = 'todos' | 'acreditados' | 'no_acreditados';
// --- FIN DE LA MODIFICACIÓN ---

interface AcreditacionContainerProps {
  asistentes: Asistente[];
  camposFormulario: CampoFormulario[];
  onUpdateStatus: (id_inscripcion: number, estado: 'acreditado' | 'denegado' | 'pendiente') => void;
  updatingId?: number | null;
  // --- INICIO DE LA MODIFICACIÓN ---
  // 3. Añadir los nuevos props a la interfaz
  filtroEstado: FiltroEstado;
  onFiltroChange: (filtro: FiltroEstado) => void;
  // --- FIN DE LA MODIFICACIÓN ---
}

export default function AcreditacionContainer({
  asistentes,
  camposFormulario,
  onUpdateStatus,
  updatingId,
  // --- INICIO DE LA MODIFICACIÓN ---
  // 4. Recibir los nuevos props
  filtroEstado,
  onFiltroChange,
  // --- FIN DE LA MODIFICACIÓN ---
}: AcreditacionContainerProps) {
  const params = useParams();
  const id_campana = String(params.id_campana || '');

  const { visibleColumns, toggleColumnVisibility } = useVisibleColumns(camposFormulario, id_campana);

  // Verificamos si existen campos personalizados visibles para mostrar el botón
  const customFieldsExist = camposFormulario.some(c => !c.es_de_sistema);

  return (
    <div>
      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* 5. Modificar este div para incluir los filtros */}
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

        {/* Botón de configurar columnas */}
        {customFieldsExist && (
          <ConfigureColumnsAcreditacion
            camposFormulario={camposFormulario}
            visibleColumns={visibleColumns}
            toggleColumnVisibility={toggleColumnVisibility}
          />
        )}
      </div>
      {/* --- FIN DE LA MODIFICACIÓN --- */}


      <div className="relative">
        <AcreditacionTable
          asistentes={asistentes}
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
    </div>
  );
}