"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CampoFormulario, TipoCampo } from "../types";

interface DynamicFormFieldProps {
  campo: CampoFormulario;
}

type OpcionObj = { id_opcion: number; etiqueta_opcion: string };
type OpcionNormalizada = { value: string; label: string };

// Type guards
function esArrayDeStrings(arr: unknown): arr is string[] {
  return Array.isArray(arr) && (arr.length === 0 || typeof arr[0] === "string");
}
function esArrayDeObjetos(arr: unknown): arr is OpcionObj[] {
  return (
    Array.isArray(arr) &&
    (arr.length === 0 ||
      (typeof arr[0] === "object" &&
        arr[0] !== null &&
        "id_opcion" in (arr[0] as any) &&
        "etiqueta_opcion" in (arr[0] as any)))
  );
}

export default function DynamicFormField({ campo }: DynamicFormFieldProps) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const error = errors[campo.nombre_interno];
  const id = `campo-${campo.id_campo}`;
  const value = watch(campo.nombre_interno);

  // Normaliza opciones a { value, label }
  const opciones: OpcionNormalizada[] = React.useMemo(() => {
    const raw = (campo as any)?.opciones;
    if (!raw) return [];
    if (esArrayDeStrings(raw)) {
      return raw.map((s) => {
        const t = (s ?? "").toString().trim();
        return { value: t, label: t };
      });
    }
    if (esArrayDeObjetos(raw)) {
      return raw.map((o) => ({
        // ⚠️ Guardamos el id como value. Si prefieres guardar la etiqueta, cambia a: value: o.etiqueta_opcion
        value: String(o.id_opcion),
        label: o.etiqueta_opcion,
      }));
    }
    return [];
  }, [campo]);

  const renderField = () => {
    switch (campo.tipo_campo as TipoCampo) {
      case "TEXTO_CORTO":
        return <Input id={id} {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;

      case "PARRAFO":
        return <Textarea id={id} {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;

      case "DESPLEGABLE":
        return (
          <Select value={value || ""} onValueChange={(val) => setValue(campo.nombre_interno, val)}>
            <SelectTrigger>
              <SelectValue placeholder={campo.etiqueta} />
            </SelectTrigger>
            <SelectContent>
              {opciones.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "SELECCION_UNICA":
        return (
          <RadioGroup value={value || ""} onValueChange={(val) => setValue(campo.nombre_interno, val)}>
            {opciones.map((op) => (
              <div key={op.value} className="flex items-center space-x-2">
                <RadioGroupItem id={`${id}-${op.value}`} value={op.value} />
                <Label htmlFor={`${id}-${op.value}`}>{op.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "CASILLAS": {
        const currentValues: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2 rounded-md border p-2 mt-1">
            {opciones.map((op) => {
              const checked = currentValues.includes(op.value);
              return (
                <div key={op.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${id}-${op.value}`}
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const next = isChecked
                        ? [...currentValues, op.value]
                        : currentValues.filter((v) => v !== op.value);
                      setValue(campo.nombre_interno, next);
                    }}
                  />
                  <Label htmlFor={`${id}-${op.value}`}>{op.label}</Label>
                </div>
              );
            })}
          </div>
        );
      }

      case "ARCHIVO":
        return <Input id={id} type="file" {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;

      default:
        return <Input id={id} {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;
    }
  };

  return (
    <div className="mb-3">
      {campo.tipo_campo !== "CASILLAS" && <Label htmlFor={id}>{campo.etiqueta}</Label>}
      {renderField()}
      {error && (
        <p className="text-red-500 text-sm mt-1">
          {typeof error.message === "string" ? error.message : "Este campo es requerido"}
        </p>
      )}
    </div>
  );
}
