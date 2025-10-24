"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AcreditacionTable } from './AcreditacionTable';
import { RegistrarEnPuertaDialog } from './RegistrarEnPuertaDialog';
import { AsistenteAcreditacion } from '../types';
import { getAsistentesParaAcreditar, acreditarAsistente, registrarYAcreditar } from '@/lib/api'; // Asumiendo que estas funciones existen en api.ts

// 1. Importar los Tabs
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AcreditacionContainer() {
  const params = useParams();
  const id_campana = params.id_campana as string;

  // 2. ESTADO DE LISTAS: Lista maestra y lista filtrada
  const [allAsistentes, setAllAsistentes] = useState<AsistenteAcreditacion[]>([]);
  const [filteredAsistentes, setFilteredAsistentes] = useState<AsistenteAcreditacion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  // 3. ESTADO DE FILTROS Y CONTADORES
  const [filterStatus, setFilterStatus] = useState<'todos' | 'acreditados' | 'pendientes'>('todos');
  const [counts, setCounts] = useState({ acreditados: 0, total: 0 });

  // --- OBTENCIÓN DE DATOS ---
  const fetchAsistentes = async () => {
    setLoading(true);
    try {
      const res = await getAsistentesParaAcreditar(id_campana);
      const data = await res.json();
      if (data.success) {
        // Guardamos la lista completa en la lista maestra
        setAllAsistentes(data.data);
      } else {
        toast.error(data.error || 'No se pudieron cargar los asistentes.');
      }
    } catch (error) {
      toast.error('Error de conexión al cargar asistentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsistentes();
  }, [id_campana]);

  // 4. LÓGICA REACTIVA: Este useEffect recalcula todo cuando cambia la lista maestra o los filtros
  useEffect(() => {
    // 4.1. Calcular contadores
    const accreditedCount = allAsistentes.filter(a => a.fecha_acreditacion !== null).length;
    setCounts({ acreditados: accreditedCount, total: allAsistentes.length });

    // 4.2. Filtrar por búsqueda (searchTerm)
    const searched = allAsistentes.filter(a =>
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.rut && a.rut.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 4.3. Filtrar por estado (Tabs)
    let statusFiltered: AsistenteAcreditacion[] = [];
    if (filterStatus === 'acreditados') {
      statusFiltered = searched.filter(a => a.fecha_acreditacion !== null);
    } else if (filterStatus === 'pendientes') {
      statusFiltered = searched.filter(a => a.fecha_acreditacion === null);
    } else {
      statusFiltered = searched; // 'todos'
    }
    
    setFilteredAsistentes(statusFiltered);

  }, [allAsistentes, searchTerm, filterStatus]); // Re-ejecutar si cambia la lista, el término de búsqueda o el filtro

  // --- MANEJADORES DE ACCIONES ---

  // Se llama desde AcreditacionTable
  const handleAcreditar = async (id_inscripcion: number) => {
    try {
      // (Aquí iría la llamada a la API, ej: acreditarAsistente(id_inscripcion))
      // const res = await acreditarAsistente(id_inscripcion, ...);
      // const data = await res.json();
      
      // if (!data.success) {
      //   toast.error(data.error || "No se pudo acreditar.");
      //   return;
      // }

      // Simulación de éxito (o al recibir éxito de la API)
      toast.success('Asistente acreditado');

      // Actualizamos la lista maestra (¡MUY IMPORTANTE!)
      // Esto dispara el useEffect de arriba y actualiza los filtros y contadores
      setAllAsistentes(prevAsistentes =>
        prevAsistentes.map(asistente =>
          asistente.id_inscripcion === id_inscripcion
            ? { ...asistente, fecha_acreditacion: new Date().toISOString() } // Marcamos como acreditado localmente
            : asistente
        )
      );

    } catch (error) {
      toast.error("Error al acreditar.");
    }
  };

  // Se llama desde AcreditacionTable (si existe la función de desacreditar)
  const handleDesacreditar = async (id_inscripcion: number) => {
     try {
      // (Aquí iría la llamada a la API, ej: desacreditarAsistente(id_inscripcion))
      // ...
      
      // Simulación de éxito
      toast.success('Acreditación revertida');

      // Actualizamos la lista maestra
      setAllAsistentes(prevAsistentes =>
        prevAsistentes.map(asistente =>
          asistente.id_inscripcion === id_inscripcion
            ? { ...asistente, fecha_acreditacion: null } // Marcamos como NO acreditado
            : asistente
        )
      );

    } catch (error)
      toast.error("Error al revertir acreditación.");
    }
  };


  // Se llama desde el diálogo de registro en puerta
  const handleRegistroEnPuerta = async (formData: any) => {
    try {
      // (Llamada a la API de registro y acreditación)
      // const res = await registrarYAcreditar(id_campana, formData);
      // const data = await res.json();
      
      // if (!data.success) {
      //   toast.error(data.error || "No se pudo registrar.");
      //   return false;
      // }

      // const nuevoAsistente = data.data; // El nuevo asistente
      
      // Simulación de éxito
      const nuevoAsistente = { 
        ...formData, 
        id_inscripcion: Math.random() * 1000, // ID de simulacion
        fecha_acreditacion: new Date().toISOString() // Ya viene acreditado
      };
      
      // Añadimos el nuevo asistente a la lista maestra
      setAllAsistentes(prev => [nuevoAsistente, ...prev]);
      
      toast.success('Asistente registrado y acreditado.');
      return true; // Para cerrar el modal

    } catch (error) {
      toast.error("Error al registrar en puerta.");
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <RegistrarEnPuertaDialog
        isOpen={isRegisterDialogOpen}
        setIsOpen={setIsRegisterDialogOpen}
        onSubmit={handleRegistroEnPuerta}
        // (Probablemente necesites pasar los campos del formulario aquí)
        // formFields={...} 
      />

      {/* --- SECCIÓN DE CONTADORES Y FILTROS --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-card border rounded-lg shadow-sm">
        <div className="text-left">
          <span className="text-xl font-semibold text-primary">Progreso de Acreditación</span>
          <p className="text-4xl font-bold">
            {counts.acreditados}
            <span className="text-2xl font-normal text-muted-foreground"> / {counts.total}</span>
          </p>
        </div>
        
        <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="acreditados">Acreditados</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* --- SECCIÓN DE BÚSQUEDA Y ACCIONES --- */}
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          placeholder="Buscar por nombre, email, RUT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={() => setIsRegisterDialogOpen(true)} className="w-full md:w-auto">
          Registrar en Puerta
        </Button>
      </div>

      {/* --- TABLA DE DATOS (AHORA FILTRADA) --- */}
      <AcreditacionTable
        asistentes={filteredAsistentes}
        loading={loading}
        onAcreditar={handleAcreditar}
        onDesacreditar={handleDesacreditar} // Pasa la nueva función
        // (Pasa cualquier otra prop necesaria, como 'visibleColumns')
      />
    </div>
  );
}