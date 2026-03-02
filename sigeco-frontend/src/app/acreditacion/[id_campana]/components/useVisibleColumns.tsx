"use client";

import { useState, useEffect } from "react";
import { CampoFormulario } from "../types";

export const useVisibleColumns = (
  camposFormulario: CampoFormulario[],
  idCampana: string
) => {
  const storageKey = `visibleColumns_${idCampana}`;

  // NUNCA se pueden ocultar
  const unhideableColumns = ["nombre", "email", "nivel", "estado_acreditacion"];

  // Visibles por defecto
  const defaultVisibleColumns = [
    "nombre",
    "email",
    "nivel",
    "estado_acreditacion",
    "estado_pago",
    "fecha_creacion_contacto",
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const item = window.localStorage.getItem(storageKey);

      if (item) {
        const storedColumns: string[] = JSON.parse(item);

        unhideableColumns.forEach((col) => {
          if (!storedColumns.includes(col)) {
            storedColumns.push(col);
          }
        });

        return storedColumns;
      }
    } catch (error) {
      console.log("Error reading from localStorage during init", error);
    }

    return [...defaultVisibleColumns];
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (error) {
      console.log("Error saving to localStorage", error);
    }
  }, [visibleColumns, storageKey]);

  const toggleColumnVisibility = (nombre_interno: string) => {
    if (unhideableColumns.includes(nombre_interno)) {
      return;
    }

    setVisibleColumns((prev) => {
      const isVisible = prev.includes(nombre_interno);

      if (isVisible) {
        return prev.filter((col) => col !== nombre_interno);
      }

      return [...prev, nombre_interno];
    });
  };

  return { visibleColumns, toggleColumnVisibility };
};