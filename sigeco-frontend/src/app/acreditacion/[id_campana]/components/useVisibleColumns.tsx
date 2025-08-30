"use client";
import { useState, useEffect } from 'react';
import { CampoFormulario } from '../types';

export const useVisibleColumns = (camposFormulario: CampoFormulario[], idCampana: string) => {
  const storageKey = `visibleColumns_${idCampana}`;

  // Columnas que NUNCA se pueden ocultar
  const unhideableColumns = ['nombre', 'email'];

  // Columnas visibles por defecto al cargar la página por primera vez.
  // Ahora solo son 'nombre' y 'email'.
  const defaultVisibleColumns = ['nombre', 'email'];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // Intentamos leer desde localStorage directamente en la inicialización.
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        const storedColumns: string[] = JSON.parse(item);
        // Nos aseguramos de que las columnas no ocultables siempre estén presentes.
        unhideableColumns.forEach(col => {
            if (!storedColumns.includes(col)) {
                storedColumns.push(col)
            }
        });
        return storedColumns;
      }
    } catch (error) {
      console.log("Error reading from localStorage during init", error);
    }
    
    // Si no hay nada en localStorage, usamos los valores por defecto.
    return [...defaultVisibleColumns];
  });

  // Guardar en localStorage cada vez que las columnas visibles cambien.
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (error) {
      console.log("Error saving to localStorage", error);
    }
  }, [visibleColumns, storageKey]);

  const toggleColumnVisibility = (nombre_interno: string) => {
    // Prevenir que las columnas no ocultables sean removidas.
    if (unhideableColumns.includes(nombre_interno)) {
      return;
    }

    setVisibleColumns(prev => {
      const isVisible = prev.includes(nombre_interno);
      if (isVisible) {
        // Si la columna está visible, la quitamos.
        return prev.filter(col => col !== nombre_interno);
      } else {
        // Si no está visible, la añadimos al final del array.
        // Esto la colocará después de 'email' y antes de 'Acción'.
        return [...prev, nombre_interno];
      }
    });
  };

  return { visibleColumns, toggleColumnVisibility };
};