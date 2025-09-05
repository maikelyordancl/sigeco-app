'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import countryList from 'react-select-country-list';
import { ArrowLeft } from 'lucide-react';

import type { CampanaPublica, Ticket, FormularioConfig, FormularioCampo } from './types';

// ---------- Utilidades / tipos ----------
type FormDataShape = { [key: string]: string | string[] | FileList | null | undefined };

// Aceptamos tanto FormularioConfig ({ campos: [...] }) como un array directo de campos
type FormularioProp = FormularioConfig | FormularioCampo[] | undefined | null;

// Normaliza a siempre un array de campos
const normalizeCampos = (formulario: FormularioProp): FormularioCampo[] => {
  if (Array.isArray(formulario)) return formulario.filter(Boolean) as FormularioCampo[];
  if (formulario && Array.isArray((formulario as FormularioConfig).campos)) {
    return ((formulario as FormularioConfig).campos || []).filter(Boolean) as FormularioCampo[];
  }
  return [];
};

// ---------- RUT helpers ----------
const cleanRut = (rut: string) => rut.replace(/[^0-9kK]/g, '').toUpperCase();

const computeDv = (numStr: string) => {
  let sum = 0;
  let mul = 2;
  for (let i = numStr.length - 1; i >= 0; i--) {
    sum += parseInt(numStr[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return '0';
  if (rest === 10) return 'K';
  return String(rest);
};

const isValidRut = (rutInput?: string | null) => {
  if (!rutInput || typeof rutInput !== 'string') return false;
  const rut = cleanRut(rutInput);
  if (rut.length < 2) return false;
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  return computeDv(cuerpo) === dv.toUpperCase();
};

const formatRut = (rutInput: string) => {
  const rut = cleanRut(rutInput);
  if (rut.length <= 1) return rut;
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  // poner puntos cada 3 desde derecha
  let cuerpoRev = cuerpo.split('').reverse().join('');
  cuerpoRev = cuerpoRev.replace(/(\d{3})(?=\d)/g, '$1.');
  const cuerpoFmt = cuerpoRev.split('').reverse().join('');
  return `${cuerpoFmt}-${dv}`;
};

// ---------- Schema dinámico ----------
const buildSchema = (campos: FormularioCampo[]) => {
  if (!Array.isArray(campos) || campos.length === 0) {
    return yup.object().shape({});
  }

  const shape: Record<string, any> = {};
  for (const campo of campos) {
    if (!campo || !campo.es_visible) continue;
    let validator: any;

    switch (campo.tipo_campo) {
      case 'TEXTO_CORTO': {
        // Casos especiales: email y rut
        if (campo.nombre_interno === 'email') {
          validator = yup
            .string()
            .email('Debe ser un email válido.')
            .required(`El campo "${campo.etiqueta}" es obligatorio.`);
        } else if (campo.nombre_interno?.toLowerCase() === 'rut') {
          validator = yup
            .string()
            .test('rut-valido', 'RUT inválido.', (v) => (v ? isValidRut(v) : !campo.es_obligatorio))
            .transform((v) => (typeof v === 'string' ? v.trim() : v));
          if (campo.es_obligatorio) {
            validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
          } else {
            validator = validator.nullable().transform((v: any) => (v === '' ? null : v));
          }
        } else {
          validator = yup.string();
          if (campo.es_obligatorio) {
            validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
          } else {
            validator = validator.nullable().transform((v: any) => (v === '' ? null : v));
          }
        }
        break;
      }
      case 'PARRAFO':
        validator = yup.string();
        if (campo.es_obligatorio) {
          validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
        } else {
          validator = validator.nullable().transform((v: any) => (v === '' ? null : v));
        }
        break;
      case 'DESPLEGABLE':
      case 'SELECCION_UNICA':
        validator = yup.string();
        if (campo.es_obligatorio) {
          validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
        } else {
          validator = validator.nullable().transform((v: any) => (v === '' ? null : v));
        }
        break;
      case 'CASILLAS': {
        validator = yup.array().of(yup.string());
        if (campo.es_obligatorio) {
          validator = validator.min(1, `Debes seleccionar al menos una opción para "${campo.etiqueta}".`);
        } else {
          validator = validator.nullable();
        }
        break;
      }
      case 'ARCHIVO': {
        validator = yup.mixed();
        if (campo.es_obligatorio) {
          validator = validator.test(
            'required',
            `El archivo para "${campo.etiqueta}" es obligatorio.`,
            (v: any) => !!v && v.length > 0
          );
        } else {
          validator = validator.nullable();
        }
        break;
      }
      default: {
        validator = yup.string();
        if (campo.es_obligatorio) {
          validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
        } else {
          validator = validator.nullable().transform((v: any) => (v === '' ? null : v));
        }
      }
    }

    shape[campo.nombre_interno] = validator;
  }

  return yup.object().shape(shape);
};

// ---------- Subcomponentes ----------
const TicketSelector = ({
  tickets,
  onSelect,
}: {
  tickets: Ticket[];
  onSelect: (t: Ticket) => void;
}) => {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v);
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-lg border-b pb-2">Elige tu entrada</h4>
      {tickets?.length > 0 ? (
        tickets.map((t) => (
          <div
            key={t.id_tipo_entrada}
            className="p-3 border rounded-md flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{t.nombre}</p>
              <p className="text-sm font-bold">{formatCurrency(Number(t.precio))}</p>
            </div>
            <Button variant="outline" onClick={() => onSelect(t)}>
              Seleccionar
            </Button>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No hay tickets disponibles.</p>
      )}
    </div>
  );
};

const EmailCheckStep = ({
  email,
  setEmail,
  onContinue,
  onBack,
  loading,
}: {
  email: string;
  setEmail: (v: string) => void;
  onContinue: () => void;
  onBack?: () => void;
  loading: boolean;
}) => (
  <div className="space-y-4">
    {onBack ? (
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a seleccionar
      </Button>
    ) : null}
    <h4 className="font-semibold text-lg border-b pb-2">Paso 1: Ingresa tu email</h4>
    <Label htmlFor="email-check">Correo Electrónico*</Label>
    <Input
      id="email-check"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="tu.correo@ejemplo.com"
    />
    <Button onClick={onContinue} disabled={loading} className="w-full">
      {loading ? 'Verificando...' : 'Continuar'}
    </Button>
  </div>
);

const DynamicForm = ({
  campos,
  onSubmit,
  isSubmitting,
  defaultValues,
}: {
  campos: FormularioCampo[];
  onSubmit: (d: FormDataShape, reset: () => void) => void;
  isSubmitting: boolean;
  defaultValues?: Record<string, any>;
}) => {
  const schema = useMemo(() => buildSchema(campos), [campos]);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormDataShape>({
    resolver: yupResolver(schema),
    defaultValues: {
      pais: defaultValues?.pais || 'CL', // Chile por defecto
      ...defaultValues,
    },
  });

  const renderCampo = (campo: FormularioCampo) => {
    if (!campo?.es_visible) return null;
    const fieldName = campo.nombre_interno;
    const error = errors[fieldName] as any;
    const isEmail = fieldName === 'email';
    const isRut = fieldName?.toLowerCase() === 'rut';
    const etiqueta = fieldName === 'nombre' ? 'Nombre Completo' : campo.etiqueta;

    // País
    if (fieldName === 'pais') {
      const options = countryList().getData();
      return (
        <div key={campo.id_campo}>
          <Label htmlFor={fieldName}>
            {etiqueta}
            {campo.es_obligatorio ? '*' : ''}
          </Label>
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={String(field.value || 'CL')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un país..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt: { value: string; label: string }) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
        </div>
      );
    }

    return (
      <div key={campo.id_campo}>
        <Label htmlFor={fieldName} className="block text-lg font-medium text-gray-800">
          {etiqueta}
          {campo.es_obligatorio ? '*' : ''}
        </Label>

        {campo.tipo_campo === 'TEXTO_CORTO' && (
          <Input
            id={fieldName}
            {...register(fieldName)}
            type={isEmail ? 'email' : 'text'}
            readOnly={isEmail && defaultValues?.[fieldName]}
            className={isEmail && defaultValues?.[fieldName] ? 'bg-gray-100' : ''}
            onBlur={(e) => {
              if (isRut && e.target.value) {
                const formatted = formatRut(e.target.value);
                setValue(fieldName, formatted as any, { shouldValidate: true, shouldDirty: true });
              }
            }}
            placeholder={isRut ? '12.345.678-5' : undefined}
          />
        )}

        {campo.tipo_campo === 'PARRAFO' && <Textarea id={fieldName} {...register(fieldName)} />}

        {campo.tipo_campo === 'DESPLEGABLE' && (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={String(field.value || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción..." />
                </SelectTrigger>
                <SelectContent>
                  {campo.opciones?.map((opt) => (
                    <SelectItem
                      key={opt.id_opcion ?? opt.etiqueta_opcion}
                      value={opt.etiqueta_opcion}
                    >
                      {opt.etiqueta_opcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}

        {campo.tipo_campo === 'SELECCION_UNICA' && (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <div className="space-y-2 rounded-md border p-2 mt-1">
                {campo.opciones?.map((opt) => (
                  <div key={opt.id_opcion} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${fieldName}-${opt.id_opcion}`}
                      {...field}
                      value={opt.etiqueta_opcion}
                      checked={field.value === opt.etiqueta_opcion}
                      className="form-radio h-4 w-4 text-blue-600 transition"
                    />
                    <Label htmlFor={`${fieldName}-${opt.id_opcion}`}>{opt.etiqueta_opcion}</Label>
                  </div>
                ))}
              </div>
            )}
          />
        )}

        {campo.tipo_campo === 'CASILLAS' && (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <div className="space-y-2 rounded-md border p-2 mt-1">
                {campo.opciones?.map((opt) => (
                  <div key={opt.id_opcion} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${fieldName}-${opt.id_opcion}`}
                      checked={(field.value as string[])?.includes(opt.etiqueta_opcion)}
                      onCheckedChange={(checked) => {
                        const current = (field.value as string[]) || [];
                        if (checked) field.onChange([...current, opt.etiqueta_opcion]);
                        else field.onChange(current.filter((v: string) => v !== opt.etiqueta_opcion));
                      }}
                    />
                    <Label htmlFor={`${fieldName}-${opt.id_opcion}`}>{opt.etiqueta_opcion}</Label>
                  </div>
                ))}
              </div>
            )}
          />
        )}

        {campo.tipo_campo === 'ARCHIVO' && <Input id={fieldName} {...register(fieldName)} type="file" />}

        {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d, reset))} className="space-y-4">
      {(campos || []).map(renderCampo)}
      <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
        {isSubmitting ? 'Procesando...' : 'Finalizar Inscripción'}
      </Button>
    </form>
  );
};

// ---------- Contenedor del flujo PRO ----------
const RegistrationForm: React.FC<{
  campana: CampanaPublica;
  tickets: Ticket[];
  formulario: FormularioProp;
}> = ({ campana, tickets, formulario }) => {
  const campos = normalizeCampos(formulario);
  const isPago = !!campana.obligatorio_pago;
  const [step, setStep] = useState<'selection' | 'email_check' | 'form'>(isPago ? 'selection' : 'form');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [email, setEmail] = useState('');
  const [prefilled, setPrefilled] = useState<Record<string, any> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPago) setStep('form');
  }, [isPago]);

  const handleSelect = (t: Ticket) => {
    setSelectedTicket(t);
    setStep('email_check');
  };

  const handleBack = () => {
    setSelectedTicket(null);
    setPrefilled(null);
    setEmail('');
    setStep('selection');
  };

  const handleVerifyEmail = async () => {
    const schema = yup.string().email('Email no válido').required('Email requerido');
    try {
      await schema.validate(email);
    } catch (e: any) {
      toast.error(e.message);
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Verificando email...');
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/verificar-contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id_campana: campana.id_campana }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.message || 'Error al verificar el correo.');

      const { contacto, inscripcion } = json.data || {};
      if (inscripcion && inscripcion.estado_pago === 'Pagado') {
        throw new Error('Ya tienes una entrada válida para este evento.');
      }
      if (contacto) {
        setPrefilled(contacto);
        toast.success('¡Hola de nuevo! Hemos rellenado tus datos.', { id: toastId });
      } else {
        setPrefilled({ email });
        toast.success('Email verificado. Por favor, completa tus datos.', { id: toastId });
      }
      setStep('form');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo verificar el email', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitInscripcion = async (formData: FormDataShape, reset: () => void) => {
    setSubmitting(true);
    const toastId = toast.loading('Procesando inscripción...');

    const data = new FormData();
    data.append('id_campana', String(campana.id_campana));
    if (selectedTicket) data.append('id_tipo_entrada', String(selectedTicket.id_tipo_entrada));

    for (const key in formData) {
      if (!Object.prototype.hasOwnProperty.call(formData, key)) continue;
      const value = formData[key];
      if (value instanceof FileList && value.length > 0) data.append(key, value[0]);
      else if (Array.isArray(value)) data.append(key, JSON.stringify(value));
      else if (value !== null && value !== undefined) data.append(key, String(value));
    }

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/inscripcion`, {
        method: 'POST',
        body: data,
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.message || 'Ocurrió un error al procesar tu inscripción.');

      if (json.success && json.redirectUrl) {
        toast.success('Redirigiendo a la pasarela de pago...', { id: toastId });
        window.location.href = json.redirectUrl as string;
        return;
      }

      toast.success('¡Inscripción exitosa! Revisa tu email.', { id: toastId, duration: 6000 });
      reset();
      if (isPago) setStep('selection');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo completar la inscripción', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold">
          {isPago ? 'Registrarse / Comprar' : 'Registrarse'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPago ? (
          step === 'selection' ? (
            <TicketSelector tickets={tickets || []} onSelect={handleSelect} />
          ) : step === 'email_check' ? (
            <EmailCheckStep
              email={email}
              setEmail={setEmail}
              onContinue={handleVerifyEmail}
              onBack={handleBack}
              loading={submitting}
            />
          ) : (
            <DynamicForm
              campos={campos}
              onSubmit={handleSubmitInscripcion}
              isSubmitting={submitting}
              defaultValues={prefilled || undefined}
            />
          )
        ) : (
          <DynamicForm
            campos={campos}
            onSubmit={handleSubmitInscripcion}
            isSubmitting={submitting}
            defaultValues={prefilled || undefined}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
