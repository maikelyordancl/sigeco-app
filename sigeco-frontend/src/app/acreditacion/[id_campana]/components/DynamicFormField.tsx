"use client";

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CampoFormulario, TipoCampo } from '../types';

interface DynamicFormFieldProps {
  campo: CampoFormulario;
}

export default function DynamicFormField({ campo }: DynamicFormFieldProps) {
  const { register, control, formState: { errors }, setValue, watch } = useFormContext();
  const error = errors[campo.nombre_interno];
  const id = `campo-${campo.id_campo}`;
  const value = watch(campo.nombre_interno);

  const renderField = () => {
    switch (campo.tipo_campo as TipoCampo) {
      case 'TEXTO_CORTO':
        return <Input id={id} {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;

      case 'PARRAFO':
        return <Textarea id={id} {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;

      case 'DESPLEGABLE':
        return (
          <Select value={value || ""} onValueChange={(val) => setValue(campo.nombre_interno, val)}>
            <SelectTrigger>
              <SelectValue placeholder={campo.etiqueta} />
            </SelectTrigger>
            <SelectContent>
              {campo.opciones?.split(',').map((opcion) => (
                <SelectItem key={opcion.trim()} value={opcion.trim()}>
                  {opcion.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'SELECCION_UNICA':
        return (
          <RadioGroup value={value} onValueChange={(val) => setValue(campo.nombre_interno, val)}>
            {campo.opciones?.split(',').map((opcion) => (
              <div key={opcion.trim()} className="flex items-center space-x-2">
                <RadioGroupItem id={`${id}-${opcion.trim()}`} value={opcion.trim()} />
                <Label htmlFor={`${id}-${opcion.trim()}`}>{opcion.trim()}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'CASILLAS':
        return (
          <div className="space-y-2 rounded-md border p-2 mt-1">
            {campo.opciones?.split(',').map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`${id}-${i}`}
                  checked={(value as string[])?.includes(opt.trim()) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = (value as string[]) || [];
                    if (checked) {
                      setValue(campo.nombre_interno, [...currentValues, opt.trim()]);
                    } else {
                      setValue(campo.nombre_interno, currentValues.filter(v => v !== opt.trim()));
                    }
                  }}
                />
                <Label htmlFor={`${id}-${i}`}>{opt.trim()}</Label>
              </div>
            ))}
          </div>
        );

      case 'ARCHIVO':
        return <Input id={id} type="file" {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;

      default:
        return <Input id={id} {...register(campo.nombre_interno, { required: campo.es_obligatorio })} />;
    }
  };

  return (
    <div className="mb-3">
      {campo.tipo_campo !== 'CASILLAS' && <Label htmlFor={id}>{campo.etiqueta}</Label>}
      {renderField()}
      {error && (
        <p className="text-red-500 text-sm mt-1">
          {typeof error.message === 'string' ? error.message : 'Este campo es requerido'}
        </p>
      )}
    </div>
  );
}
