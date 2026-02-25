"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast, type Toast } from 'react-hot-toast'; // ✅ FIX: tipado Toast
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
  // --- INICIO DE LA MODIFICACIÓN (Problema 2) ---
  // Nos aseguramos que el tipo incluya id_evento
  id_evento?: number;
  // --- FIN DE LA MODIFICACIÓN ---
  [key: string]: any;
};

type FiltroEstado = 'todos' | 'acreditados' | 'no_acreditados';

// --- INICIO DE LA MODIFICACIÓN (Problema 1) ---
/**
 * Normaliza un string: quita acentos y convierte a minúsculas.
 * Ej: "ROCÍO" -> "rocio"
 */
const normalizeStr = (str: string | null | undefined): string => {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD") // Separa los caracteres base de los diacríticos (acentos)
    .replace(/[\u0300-\u036f]/g, "") // Elimina los diacríticos
    .toLowerCase(); // Convierte a minúsculas
};
// --- FIN DE LA MODIFICACIÓN ---

export default function AcreditarCampanaPage() {
  const router = useRouter();
  const params = useParams();
  const id_campana = params.id_campana as string;

  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>([]);
  const [searchTerm, _setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campanaInfo, setCampanaInfo] = useState<CampanaInfo | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  
  // --- INICIO DE LA MODIFICACIÓN (Problema 2) ---
  // 1. Nuevo estado para el nombre del evento
  const [eventName, setEventName] = useState<string>('');
  // --- FIN DE LA MODIFICACIÓN ---

  const { visibleColumns: _visibleColumns, toggleColumnVisibility: _toggleColumnVisibility } = useVisibleColumns(camposFormulario, id_campana);

  // --- INICIO DE LA MODIFICACIÓN (Problema 2) ---
  // 2. Modificamos fetchPageData para que obtenga el id_evento y luego el nombre del evento
  const fetchPageData = useCallback(async () => {
    if (!id_campana) return;
    setLoading(true);
    try {
      // 2.A. Obtenemos primero la info de la campaña para sacar el id_evento
      const campanaRes = await apiFetch(`/campanas/${id_campana}`);
      const campanaResult = await campanaRes.json();

      if (!campanaResult.success) {
        throw new Error(campanaResult.error || 'No se pudo cargar la info de la campaña.');
      }
      
      const infoCampana: CampanaInfo = campanaResult.data;
      setCampanaInfo(infoCampana); // Guardamos la info de la campaña
      
      const eventId = infoCampana.id_evento; // Extraemos el id_evento

      // 2.B. Preparamos los fetches paralelos
      const fetches: Promise<Response>[] = [
        apiFetch(`/campanas/${id_campana}/asistentes-v2?limit=2000`),
        apiFetch(`/campanas/${id_campana}/formulario`),
      ];

      // 2.C. Si encontramos un eventId, añadimos el fetch del evento
      if (eventId) {
        fetches.push(apiFetch(`/campanas/evento/${eventId}`));
      }

      // 2.D. Ejecutamos los fetches en paralelo
      const [asistentesRes, formRes, eventRes] = await Promise.all(fetches);

      // Procesamos asistentes (sin cambios)
      const asistentesData = await asistentesRes.json();
      if (Array.isArray(asistentesData)) {
        setAsistentes(asistentesData);
      } else if (asistentesData?.data && Array.isArray(asistentesData.data)) {
        setAsistentes(asistentesData.data);
      } else if (asistentesData?.asistentes && Array.isArray(asistentesData.asistentes)) {
        setAsistentes(asistentesData.asistentes);
      } else {
        setAsistentes([]);
      }

      // Procesamos formulario (sin cambios)
      const formResult = await formRes.json();
      if (formResult.success) {
        let campos: CampoFormulario[] = formResult.data.map((c: any) => ({
          ...c,
          es_de_sistema: c.es_de_sistema,
          tipo_campo: c.tipo_campo as TipoCampo
        }));
        const estadoAsistenciaCampo: CampoFormulario = {
          id_campo: -1,
          nombre_interno: 'estado_asistencia',
          etiqueta: 'Estado',
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: 'TEXTO_CORTO',
          es_obligatorio: false,
          orden: -999,
        };

        // Campo de sistema: fecha en que se acreditó (si aplica)
        const fechaAcreditacionCampo: CampoFormulario = {
          id_campo: -2,
          nombre_interno: 'fecha_acreditacion',
          etiqueta: 'Fecha acreditación',
          es_visible: true,
          es_de_sistema: true,
          tipo_campo: 'TEXTO_CORTO',
          es_obligatorio: false,
          orden: -998,
        };

        campos.unshift(estadoAsistenciaCampo);
        campos.unshift(fechaAcreditacionCampo);
        setCamposFormulario(campos);
      } else {
        throw new Error('No se pudo cargar la configuración del formulario.');
      }

      // 2.E. Procesamos la respuesta del evento (si existió)
      if (eventRes) {
        const eventResult = await eventRes.json();
        if (eventResult.success) {
          setEventName(eventResult.data.eventName); // Guardamos el nombre del evento
        } else {
          console.warn("No se pudo cargar el nombre del evento.");
        }
      }

    } catch (error: any) {
      toast.error(error.message || "Error al cargar los datos de la página.");
    } finally {
      setLoading(false);
    }
  }, [id_campana]);
  // --- FIN DE LA MODIFICACIÓN ---


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const filteredAsistentes = useMemo(() => {
    if (isModalOpen) return asistentes;

    let filtrados = [...asistentes];

    // Filtro de estado (sin cambios)
    if (filtroEstado === 'acreditados') {
      filtrados = filtrados.filter(a => a.estado_asistencia === EstadoAsistencia.Asistio);
    } else if (filtroEstado === 'no_acreditados') {
      filtrados = filtrados.filter(a => a.estado_asistencia !== EstadoAsistencia.Asistio);
    }

    // Filtro de búsqueda
    if (searchTerm) {
      // --- INICIO DE LA MODIFICACIÓN (Problema 1) ---
      // 1. Normalizamos el término de búsqueda UNA sola vez
      const normalizedSearchTerm = normalizeStr(searchTerm);
      
      filtrados = filtrados.filter(asistente =>
        // 2. Iteramos sobre los valores y normalizamos CADA valor para comparar
        Object.values(asistente).some(value =>
          normalizeStr(value).includes(normalizedSearchTerm)
        )
      );
      // --- FIN DE LA MODIFICACIÓN ---
    }

    return filtrados;
  }, [asistentes, searchTerm, isModalOpen, filtroEstado]);

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

      // --- INICIO DE LA MODIFICACIÓN (Ventana de info al acreditar - ESTILO AMARILLO) ---
      // Si se acreditó, mostramos una "ventana" (toast) con título "ACREDITADO" amarillo
      // y acentos amarillos (sin verde pastel).
      if (nuevo_estado === 'acreditado') {
        // Cerramos el toast de loading
        toast.dismiss(toastId);

        const asistente = originalAsistentes.find(a => a.id_inscripcion === id_inscripcion);
        const nombre = (asistente as any)?.nombre || (asistente as any)?.Nombre || (asistente as any)?.NOMBRE || '';
        const email = (asistente as any)?.email || (asistente as any)?.Email || (asistente as any)?.EMAIL || '';
        const rut = (asistente as any)?.rut || (asistente as any)?.RUT || '';
        const fechaHora = new Date().toLocaleString('es-CL');

        toast.custom(
          (t: Toast) => (
            <div className="pointer-events-auto w-full max-w-2xl">
              <div className="rounded-2xl overflow-hidden border border-yellow-300 bg-white shadow-2xl">
                {/* Header estilo propuesta: solo palabra ACREDITADO en amarillo */}
                <div className="bg-gray-200 px-6 py-6 text-center">
                  <p className="text-5xl font-extrabold tracking-wide text-yellow-400">
                    ACREDITADO
                  </p>
                </div>

                {/* Línea separadora amarilla */}
                <div className="h-3 bg-yellow-300" />

                {/* Contenido (se mantiene, pero sin verdes) 
                <div className="p-6">
                  <div className="flex items-start gap-5">
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-gray-700">
                        {nombre ? (
                          <>
                            El usuario <span className="font-semibold">{nombre}</span> se ha acreditado correctamente.
                          </>
                        ) : (
                          <>El asistente se ha acreditado correctamente.</>
                        )}
                      </p>

                      <p className="text-sm text-gray-500 mt-3">Más información</p>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-yellow-50 p-3 ring-1 ring-inset ring-yellow-200">
                          <p className="text-yellow-700">Estado</p>
                          <p className="font-semibold text-yellow-900">Acreditado</p>
                        </div>

                        <div className="rounded-lg bg-yellow-50/60 p-3 ring-1 ring-inset ring-yellow-100">
                          <p className="text-gray-600">Fecha/Hora</p>
                          <p className="font-semibold text-gray-900">{fechaHora}</p>
                        </div>

                        <div className="rounded-lg bg-yellow-50/60 p-3 ring-1 ring-inset ring-yellow-100">
                          <p className="text-gray-600">ID Inscripción</p>
                          <p className="font-semibold text-gray-900">{id_inscripcion}</p>
                        </div>

                        {rut && (
                          <div className="rounded-lg bg-yellow-50/60 p-3 ring-1 ring-inset ring-yellow-100">
                            <p className="text-gray-600">RUT</p>
                            <p className="font-semibold text-gray-900">{rut}</p>
                          </div>
                        )}

                        {email && (
                          <div className="rounded-lg bg-yellow-50/60 p-3 ring-1 ring-inset ring-yellow-100 sm:col-span-2">
                            <p className="text-gray-600">Email</p>
                            <p className="font-semibold text-gray-900 break-all">{email}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-700"
                      aria-label="Cerrar"
                      onClick={() => toast.dismiss(t.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>*/}
              </div>
            </div>
          ),
          { duration: 1000 }
        );
      } else {
        toast.success('Estado actualizado', { id: toastId });
      }
      // --- FIN DE LA MODIFICACIÓN ---

    } catch (error: any) {
      setAsistentes(originalAsistentes);
      toast.error(error.message, { id: toastId });
    } finally {
      setUpdatingId(null);
    }
  };

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
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.push('/eventos/gestion')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
          </Button>

          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          <div className="flex flex-col items-center justify-center text-center flex-1 min-w-0 px-4">
            
            {/* Título Principal (Evento) */}
            <h1 
              className="text-2xl font-bold truncate w-full" 
              title={loading ? 'Cargando...' : `ACREDITACIÓN ${eventName}`}
            >
              {loading ? 'Cargando...' : `ACREDITACIÓN ${eventName || 'Evento'}`}
            </h1>
            
            {/* Subtítulo (Campaña) - CON TAMAÑO CORREGIDO */}
            {campanaInfo && (
              <p 
                className="text-lg text-gray-600 font-medium truncate w-full" 
                title={campanaInfo.nombre}
              >
               Campaña: {campanaInfo.nombre}
              </p>
            )}
          </div>
          {/* --- FIN DE LA MODIFICACIÓN --- */}

          {/* Este div invisible ayuda a mantener el título centrado correctamente */}
          <div style={{ width: '150px' }} className="flex-shrink-0"></div>
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
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
          />
        )}
      </div>

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