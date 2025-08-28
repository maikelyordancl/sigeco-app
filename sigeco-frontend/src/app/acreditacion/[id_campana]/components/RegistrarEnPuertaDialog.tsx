"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { FormularioCampo } from '@/app/c/[slug]/types';
import { DynamicFormField } from './DynamicFormField';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

interface RegistrarEnPuertaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id_campana: number;
  formFields: FormularioCampo[];
}

export const RegistrarEnPuertaDialog = ({
  isOpen,
  onClose,
  onSuccess,
  id_campana,
  formFields
}: RegistrarEnPuertaDialogProps) => {
  const [step, setStep] = useState<'email' | 'form'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marcarComoAsistio, setMarcarComoAsistio] = useState(true);
  const [prefilledData, setPrefilledData] = useState<Record<string, any> | null>(null);

  const contactoFields = ['nombre', 'email', 'telefono','rut','empresa','actividad','profesion','comuna','pais'];

  // --- Esquema dinámico de validación ---
  const generarSchemaValidacion = (campos: FormularioCampo[]) => {
    const shape: any = {};
    campos.forEach(campo => {
      if (!campo.es_visible) return;
      let validator: any = yup.string();
      if (campo.tipo_campo === 'CASILLAS') validator = yup.array().of(yup.string());
      if (campo.nombre_interno === 'email') validator = validator.email('Debe ser un email válido').required('El email es obligatorio');
      if (campo.es_obligatorio) validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
      shape[campo.nombre_interno] = validator;
    });
    return yup.object().shape(shape);
  };

  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm({
    resolver: yupResolver(generarSchemaValidacion(formFields)),
    defaultValues: prefilledData || {}
  });

  // --- Paso 1: verificar email ---
  const handleEmailCheck = async () => {
    if (!email) {
      toast.error('Por favor, ingresa un email.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiFetch(`/public/verificar-contacto`, {
        method: 'POST',
        body: JSON.stringify({ email, id_campana })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Error al verificar email');

      const { contacto, inscripcion } = result.data;

      if(inscripcion && inscripcion.estado_pago === 'Pagado') {
        throw new Error('Ya tienes una inscripción válida para este evento.');
      }

      const dataToPrefill = contacto || { email };
      setPrefilledData(dataToPrefill);

      Object.keys(dataToPrefill).forEach(key => setValue(key, dataToPrefill[key]));

      toast.success(contacto ? '¡Hola de nuevo! Se precargaron tus datos.' : 'Email verificado. Completa tus datos.');
      setStep('form');

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Paso 2: enviar formulario ---
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Construir body plano para que el backend reconozca campos de contacto
      const body: any = {
        id_campana,
        id_tipo_entrada: null,
        estado_asistencia: marcarComoAsistio ? 'Asistió' : 'Confirmado',
        registrado_puerta: marcarComoAsistio ? 1 : 0
      };

      // Añadir campos de contacto en la raíz
      contactoFields.forEach(key => {
        if (data[key] !== undefined) body[key] = data[key];
      });

      // Añadir respuestas personalizadas
      const respuestas: { id_campo: number; valor: string }[] = [];
      for (const key in data) {
        const field = formFields.find(f => f.nombre_interno === key);
        if (!field) continue;
        if (!contactoFields.includes(key)) {
          if (Array.isArray(data[key])) {
            data[key].forEach(val => respuestas.push({ id_campo: field.id_campo, valor: val }));
          } else {
            respuestas.push({ id_campo: field.id_campo, valor: data[key] });
          }
        }
      }
      body.respuestas = respuestas;

      const response = await apiFetch(`/acreditacion/registrar-en-puerta/${id_campana}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar al asistente');
      }

      toast.success('Asistente registrado exitosamente.');
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Hubo un error al registrar al asistente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setEmail('');
    setStep('email');
    setMarcarComoAsistio(true);
    setPrefilledData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Registrar Asistente en Puerta</DialogTitle>
        </DialogHeader>

        {step === 'email' ? (
          <div className="grid gap-4 py-4">
            <Label htmlFor="email">EMAIL DEL ASISTENTE</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              className="w-full"
            />
            <Button onClick={handleEmailCheck} disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="relative h-[60vh]">
            <div className="overflow-y-auto pr-4 pb-28 h-full space-y-4">
              {/* Campos de contacto */}
              {contactoFields.map(fieldName => (
                <div key={fieldName} className="grid gap-2">
                  <Label htmlFor={fieldName} className="font-medium">{fieldName.toUpperCase()}</Label>
                  <Input {...register(fieldName)} id={fieldName} className="w-full" />
                  {errors[fieldName]?.message && (
                    <span className="text-red-500 text-sm">{errors[fieldName]?.message}</span>
                  )}
                </div>
              ))}

              {/* Campos personalizados */}
              {formFields.filter(f => !contactoFields.includes(f.nombre_interno))
                .map(field => (
                  <DynamicFormField
                    key={field.id_campo}
                    field={field}
                    register={register}
                    control={control}
                    defaultValue={prefilledData?.[field.nombre_interno]}
                    error={errors[field.nombre_interno]}
                  />
                ))
              }
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marcar-asistio"
                  checked={marcarComoAsistio}
                  onCheckedChange={checked => setMarcarComoAsistio(Boolean(checked))}
                />
                <Label htmlFor="marcar-asistio">Marcar como Asistió al guardar</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setStep('email')}>Atrás</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Inscripción'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
