"use client";

import { useParams } from 'next/navigation';
import { Asistente, CampoFormulario, TipoCampo } from '../types';
import { AcreditacionTable } from './AcreditacionTable';
import { ConfigureColumnsAcreditacion } from './ConfigureColumnsAcreditacion';
import { useVisibleColumns } from './useVisibleColumns';

interface AcreditacionContainerProps {
  asistentes: Asistente[];
  camposFormulario: CampoFormulario[];
  onUpdateStatus: (id_inscripcion: number, estado: 'acreditado' | 'denegado' | 'pendiente') => void;
  updatingId?: number | null;
}

export default function AcreditacionContainer({
  asistentes,
  camposFormulario,
  onUpdateStatus,
  updatingId,
}: AcreditacionContainerProps) {
  const params = useParams();
  const id_campana = String(params.id_campana || '');

  const { visibleColumns, toggleColumnVisibility } = useVisibleColumns(camposFormulario, id_campana);

  // Verificamos si existen campos personalizados visibles para mostrar el botón
  const customFieldsExist = camposFormulario.some(c => !c.es_de_sistema);

  return (
    <div>
      <div className="flex justify-end mb-4">
        {customFieldsExist && (
          <ConfigureColumnsAcreditacion
            camposFormulario={camposFormulario}
            visibleColumns={visibleColumns}
            toggleColumnVisibility={toggleColumnVisibility}
          />
        )}
      </div>

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
