"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

import AcreditacionContainer from './components/AcreditacionContainer';
import { Asistente, CampoFormulario, TipoCampo } from './types';
import { FormDataShape } from './components/RegistrarEnPuertaDialog';
import RegistrarEnPuertaDialog from './components/RegistrarEnPuertaDialog';
import MainLayout from '@/components/Layout/MainLayout';
import { useVisibleColumns } from './components/useVisibleColumns';

// Enum para los estados de asistencia
enum EstadoAsistencia {
  Asistio = 'Asistió',
  Cancelado = 'Cancelado',
  Confirmado = 'Confirmado'
}

// Tipo para la info de campaña
type CampanaInfo = {
  nombre: string;
  obligatorio_pago: boolean;
  [key: string]: any;
};

// --- INICIO DE LA MODIFICACIÓN ---
// 1. Definir el tipo para el nuevo filtro
type FiltroEstado = 'todos' | 'acreditados' | 'no_acreditados';
// --- FIN DE LA MODIFICACIÓN ---

export default function AcreditarCampanaPage() {
  const router = useRouter();
  const params = useParams();
  const id_campana = params.id_campana as string;

  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // --- INICIO DE LA MODIFICACIÓN ---
  // 2. Añadir el nuevo estado para el filtro
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  // --- FIN DE LA MODIFICACIÓN ---
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campanaInfo, setCampanaInfo] = useState<CampanaInfo | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { visibleColumns, toggleColumnVisibility } = useVisibleColumns(camposFormulario, id_campana);

  // ... (fetchPageData no necesita cambios) ...
  const fetchPageData = useCallback(async () => {
    if (!id_campana) return;
    setLoading(true);
    try {
      const [asistentesRes, formRes, campanaRes] = await Promise.all([
        apiFetch(`/campanas/${id_campana}/asistentes-v2?limit=2000`),
        apiFetch(`/campanas/${id_campana}/formulario`),
        apiFetch(`/campanas/${id_campana}`)
      ]);

      const asistentesData = await asistentesRes.json();
      const formResult = await formRes.json();
      const campanaResult = await campanaRes.json();

      // Aseguramos que siempre se guarde un array
      if (Array.isArray(asistentesData)) {
        setAsistentes(asistentesData);
      } else if (asistentesData?.data && Array.isArray(asistentesData.data)) {
        setAsistentes(asistentesData.data);
      } else if (asistentesData?.asistentes && Array.isArray(asistentesData.asistentes)) {
        setAsistentes(asistentesData.asistentes);
      } else {
        setAsistentes([]);
      }

      if (formResult.success) {
        // Mapeo para que coincida con CampoFormulario y TipoCampo
        let campos: CampoFormulario[] = formResult.data.map((c: any) => ({
          ...c,
          es_de_sistema: c.es_de_sistema,
          tipo_campo: c.tipo_campo as TipoCampo
        }));

        // Añadimos manualmente el campo de estado de asistencia para que sea configurable
        const estadoAsistenciaCampo: CampoFormulario = {
          id_campo: -1, // Un ID único que no entre en conflicto
          nombre_interno: 'estado_asistencia',
          etiqueta: 'Estado',
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: 'TEXTO_CORTO', // O cualquier tipo genérico
          es_obligatorio: false,
          orden: -999,
        };

        // Lo insertamos al principio de la lista de campos
        campos.unshift(estadoAsistenciaCampo);

        setCamposFormulario(campos);
      } else {
        throw new Error('No se pudo cargar la configuración del formulario.');
      }

      if (campanaResult.success) {
        setCampanaInfo(campanaResult.data);
      }

    } catch (error: any) {
      toast.error(error.message || "Error al cargar los datos de la página.");
    } finally {
      setLoading(false);
    }
  }, [id_campana]);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const filteredAsistentes = useMemo(() => {
    // Mientras el modal esté abierto, NO aplicar filtros
    if (isModalOpen) return asistentes;

    // --- INICIO DE LA MODIFICACIÓN ---
    // 3. Actualizar lógica de filtrado
    let filtrados = [...asistentes];

    // 3.A. Aplicar filtro de estado
    if (filtroEstado === 'acreditados') {
      filtrados = filtrados.filter(a => a.estado_asistencia === EstadoAsistencia.Asistio);
    } else if (filtroEstado === 'no_acreditados') {
      filtrados = filtrados.filter(a => a.estado_asistencia !== EstadoAsistencia.Asistio);
    }
    // Si es 'todos', no se filtra por estado (se usa la lista 'filtrados' completa).

    // 3.B. Aplicar filtro de búsqueda (sobre la lista ya filtrada por estado)
    if (searchTerm) {
      filtrados = filtrados.filter(asistente =>
        Object.values(asistente).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtrados;
    // --- FIN DE LA MODIFICACIÓN ---

  }, [asistentes, searchTerm, isModalOpen, filtroEstado]); // 👈 4. AÑADIR filtroEstado a las dependencias

  // ... (handleUpdateStatus no necesita cambios) ...
  const handleUpdateStatus = async (
    id_inscripcion: number,
    nuevo_estado: 'acreditado' | 'denegado' | 'pendiente'
  ) => {
    if (updatingId !== null) return;
    setUpdatingId(id_inscripcion);

    const originalAsistentes = [...asistentes];

    const estadoBackend = {
      acreditado: EstadoAsistencia.Asistio,
      denegado: EstadoAsistencia.Cancelado,
      pendiente: EstadoAsistencia.Confirmado
    }[nuevo_estado];

    setAsistentes(prev =>
      prev.map(a =>
        a.id_inscripcion === id_inscripcion
          ? { ...a, estado_asistencia: estadoBackend }
          : a
      )
    );

    const toastId = toast.loading('Actualizando...');
    try {
      const response = await apiFetch(`/acreditacion/inscripcion/${id_inscripcion}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ nuevo_estado: estadoBackend }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'No se pudo actualizar el estado.');
      }

      toast.success('Estado actualizado', { id: toastId });

    } catch (error: any) {
      setAsistentes(originalAsistentes);
      toast.error(error.message, { id: toastId });
    } finally {
      setUpdatingId(null);
    }
  };

  // ... (stats no necesita cambios) ...
  const stats = useMemo(() => {
    const list = Array.isArray(asistentes) ? asistentes : [];
    const total = list.length;
    const acreditados = list.filter(a => a.estado_asistencia === EstadoAsistencia.Asistio).length;
    const pendientes = total - acreditados;
    return { total, acreditados, pendientes };
  }, [asistentes]);


  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* ... (Cabecera y Panel de Control no necesitan cambios) ... */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.push('/eventos/gestion')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
          </Button>
          <h1 className="text-2xl font-bold text-center">
            {campanaInfo ? `ACREDITACION ${campanaInfo.nombre}` : 'Acreditación'}
          </h1>
          <div style={{ width: '150px' }}></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Panel de Control</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-500">Acreditados</p>
                <p className="text-2xl font-bold text-green-600">{stats.acreditados}</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-600">{stats.pendientes}</p>
              </div>
            </div>

            <div className="flex flex-col flex-1 gap-2">
              <Input
                type="search"
                name="tabla_busqueda"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                placeholder="Buscar asistente (nombre, email, rut...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-yellow-200 focus:bg-yellow-50 focus:ring-2 focus:ring-yellow-300 border-yellow-200"
              />

              <div className="flex gap-2">
                {campanaInfo && !campanaInfo.obligatorio_pago && (
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Registrar en Puerta
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        {loading ? (
          <div className="text-center py-10">Cargando asistentes...</div>
        ) : (
          <AcreditacionContainer
            asistentes={filteredAsistentes}
            camposFormulario={camposFormulario}
            onUpdateStatus={handleUpdateStatus}
            updatingId={updatingId}
            // --- INICIO DE LA MODIFICACIÓN ---
            // 5. Pasar los nuevos props al container
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
            // --- FIN DE LA MODIFICACIÓN ---
          />
        )}
      </div>

      {/* ... (RegistrarEnPuertaDialog no necesita cambios) ... */}
      <RegistrarEnPuertaDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formConfig={camposFormulario.filter(c => c.nombre_interno !== 'estado_asistencia')}
        isSubmitting={false}
        id_campana={id_campana}
        // El prop 'onSubmit' ahora recibe el payload ya formateado
        onSubmit={async (payload) => {
          try {
            const toastId = toast.loading('Registrando asistente...');
            const response = await apiFetch(`/acreditacion/registrar-en-puerta/${id_campana}`, {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (!result.success) {
              throw new Error(result.error || 'No se pudo registrar el asistente.');
            }

            toast.success('Asistente registrado con éxito!', { id: toastId });
            setIsModalOpen(false);
            fetchPageData(); // Refresca la lista de asistentes

          } catch (error: any) {
            toast.error(error.message);
          }
        }}
      />
    </MainLayout>
  );
}