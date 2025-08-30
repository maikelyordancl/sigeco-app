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

export default function AcreditarCampanaPage() {
  const router = useRouter();
  const params = useParams();
  const id_campana = params.id_campana as string;

  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campanaInfo, setCampanaInfo] = useState<CampanaInfo | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { visibleColumns, toggleColumnVisibility } = useVisibleColumns(camposFormulario, id_campana);

  const fetchPageData = useCallback(async () => {
    if (!id_campana) return;
    setLoading(true);
    try {
      const [asistentesRes, formRes, campanaRes] = await Promise.all([
        apiFetch(`/campanas/${id_campana}/asistentes-v2`),
        apiFetch(`/campanas/${id_campana}/formulario`),
        apiFetch(`/campanas/${id_campana}`)
      ]);

      const asistentesData = await asistentesRes.json();
      const formResult = await formRes.json();
      const campanaResult = await campanaRes.json();

      setAsistentes(asistentesData);

      if (formResult.success) {
        // Mapeo para que coincida con CampoFormulario y TipoCampo
        const campos: CampoFormulario[] = formResult.data.map((c: CampoFormulario) => ({
          ...c,
          es_de_sistema: c.es_de_sistema,
          tipo_campo: c.tipo_campo as TipoCampo
        }));
        setCamposFormulario(campos);
      } else {
        throw new Error('No se pudo cargar la configuración del formulario.');
      }

      if(campanaResult.success) {
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
    if (!searchTerm) return asistentes;
    return asistentes.filter(asistente =>
      Object.values(asistente).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [asistentes, searchTerm]);

  const handleUpdateStatus = async (id_inscripcion: number, nuevo_estado: 'acreditado' | 'denegado' | 'pendiente') => {
    if (updatingId !== null) return;
    setUpdatingId(id_inscripcion);

    const originalAsistentes = [...asistentes];

    const estadoBackend = {
      acreditado: EstadoAsistencia.Asistio,
      denegado: EstadoAsistencia.Cancelado,
      pendiente: EstadoAsistencia.Confirmado
    }[nuevo_estado];

    setAsistentes(prev =>
      prev.map(a => a.id_inscripcion === id_inscripcion ? { ...a, estado_asistencia: estadoBackend } : a)
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

  const stats = useMemo(() => {
    const total = asistentes.length;
    const acreditados = asistentes.filter(a => a.estado_asistencia === EstadoAsistencia.Asistio).length;
    const pendientes = total - acreditados;
    return { total, acreditados, pendientes };
  }, [asistentes]);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.push('/eventos/gestion')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
          </Button>
          <h1 className="text-2xl font-bold text-center">{campanaInfo ? `ACREDITACION ${campanaInfo.nombre}` : 'Acreditación'}</h1>
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
                placeholder="Buscar asistente (nombre, email, rut...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          />
        )}
      </div>

      <RegistrarEnPuertaDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formConfig={camposFormulario}
        isSubmitting={false}
        id_campana={id_campana}
        // El prop 'onSubmit' ahora recibe el payload ya formateado
        onSubmit={async (payload) => {
          try {
            const toastId = toast.loading('Registrando asistente...');
            // --- CORRECCIÓN: Se ajusta la URL del endpoint ---
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
