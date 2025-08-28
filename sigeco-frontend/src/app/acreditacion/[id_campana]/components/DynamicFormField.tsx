"use client";

import { UseFormRegister, Controller, Control } from 'react-hook-form';
import { FormularioCampo } from '@/app/c/[slug]/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface DynamicFormFieldProps {
  field: FormularioCampo;
  register: UseFormRegister<any>;
  control: Control<any>;
  defaultValue?: any;
  error?: any;
}

export const DynamicFormField = ({ field, register, control, defaultValue, error }: DynamicFormFieldProps) => {
  if (!field.es_visible) return null;

  const fieldName = field.nombre_interno;

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldName}>
        {field.etiqueta}{field.es_obligatorio ? '*' : ''}
      </Label>

      {field.tipo_campo === 'TEXTO_CORTO' && (
        <Input
          id={fieldName}
          {...register(fieldName)}
          type={fieldName === 'email' ? 'email' : 'text'}
          className={`w-full ${fieldName === 'email' && defaultValue ? 'bg-gray-100' : ''}`}
          readOnly={fieldName === 'email' && defaultValue}
        />
      )}

      {field.tipo_campo === 'PARRAFO' && (
        <Textarea id={fieldName} {...register(fieldName)} className="w-full" />
      )}

      {field.tipo_campo === 'DESPLEGABLE' && (
        <Controller
          name={fieldName}
          control={control}
          defaultValue={defaultValue || ''}
          render={({ field: controllerField }) => (
            <Select onValueChange={controllerField.onChange} value={controllerField.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción..." />
              </SelectTrigger>
              <SelectContent>
                {field.opciones?.map((opt: { id_opcion: number; etiqueta_opcion: string }) => (
                  <SelectItem key={opt.id_opcion} value={opt.etiqueta_opcion}>
                    {opt.etiqueta_opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}

      {field.tipo_campo === 'SELECCION_UNICA' && (
        <Controller
          name={fieldName}
          control={control}
          defaultValue={defaultValue || ''}
          render={({ field: controllerField }) => (
            <div className="space-y-2 rounded-md border p-2 mt-1">
              {field.opciones?.map((opt: { id_opcion: number; etiqueta_opcion: string }) => (
                <div key={opt.id_opcion} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${fieldName}-${opt.id_opcion}`}
                    {...controllerField}
                    value={opt.etiqueta_opcion}
                    checked={controllerField.value === opt.etiqueta_opcion}
                    className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                  />
                  <Label htmlFor={`${fieldName}-${opt.id_opcion}`}>{opt.etiqueta_opcion}</Label>
                </div>
              ))}
            </div>
          )}
        />
      )}

      {field.tipo_campo === 'CASILLAS' && (
        <Controller
          name={fieldName}
          control={control}
          defaultValue={defaultValue || []}
          render={({ field: controllerField }) => (
            <div className="space-y-2 rounded-md border p-2 mt-1">
              {field.opciones?.map((opt: { id_opcion: number; etiqueta_opcion: string }) => (
                <div key={opt.id_opcion} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldName}-${opt.id_opcion}`}
                    checked={(controllerField.value as string[])?.includes(opt.etiqueta_opcion)}
                    onCheckedChange={(checked) => {
                      const currentValues = (controllerField.value as string[]) || [];
                      if (checked) {
                        controllerField.onChange([...currentValues, opt.etiqueta_opcion]);
                      } else {
                        controllerField.onChange(currentValues.filter((v: string) => v !== opt.etiqueta_opcion));
                      }
                    }}
                  />
                  <Label htmlFor={`${fieldName}-${opt.id_opcion}`}>{opt.etiqueta_opcion}</Label>
                </div>
              ))}
            </div>
          )}
        />
      )}

      {field.tipo_campo === 'ARCHIVO' && (
        <Input id={fieldName} {...register(fieldName)} type="file" />
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
};
