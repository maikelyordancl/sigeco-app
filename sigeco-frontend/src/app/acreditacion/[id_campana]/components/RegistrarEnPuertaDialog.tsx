"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { CampoFormulario } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

// --- API fetch helper ---
const apiFetch = (url: string, options: RequestInit = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });
};

const countries = [
  { value: "CL", label: "Chile" },
  { value: "AR", label: "Argentina" },
  { value: "PE", label: "Perú" },
  { value: "CO", label: "Colombia" },
  { value: "US", label: "United States" },
];

export type FormDataShape = {
  [key: string]: string | string[] | FileList | null | undefined | boolean;
};

const generarSchemaValidacion = (campos: CampoFormulario[]) => {
  const shape: { [key: string]: yup.AnySchema } = {};
  campos.forEach((campo) => {
    if (!campo.es_visible) return;

    let validator: yup.AnySchema;
    switch (campo.tipo_campo) {
      case "TEXTO_CORTO":
        validator =
          campo.nombre_interno === "email"
            ? yup.string().email("Debe ser un email válido.")
            : yup.string();
        break;
      case "PARRAFO":
        validator = yup.string();
        break;
      case "CASILLAS":
        let arrayValidator = yup.array().of(yup.string());
        if (campo.es_obligatorio) {
          arrayValidator = arrayValidator.min(
            1,
            `Debes seleccionar al menos una opción para "${campo.etiqueta}".`
          );
        }
        validator = arrayValidator;
        break;
      case "ARCHIVO":
        validator = yup.mixed();
        if (campo.es_obligatorio) {
          validator = validator.test(
            "required",
            `El archivo para "${campo.etiqueta}" es obligatorio.`,
            (value): boolean => !!value && value.length > 0
          );
        }
        break;
      case "DESPLEGABLE":
      case "SELECCION_UNICA":
        validator = yup.string();
        break;
      default:
        validator = yup.string();
    }

    if (campo.es_obligatorio && !["CASILLAS", "ARCHIVO"].includes(campo.tipo_campo)) {
      validator = validator.required(`El campo "${campo.etiqueta}" es obligatorio.`);
    } else if (!campo.es_obligatorio) {
      validator = validator
        .nullable()
        .transform((value: string | null) => (value === "" ? null : value));
    }

    shape[campo.nombre_interno] = validator;
  });

  // Agregamos el checkbox (no obligatorio)
  shape["acreditar_ahora"] = yup.boolean();

  return yup.object().shape(shape);
};

const RegistrarEnPuertaDialog = ({
  id_campana,
  formConfig = [],
  onSubmit,
  isSubmitting,
  isOpen,
  onClose,
  showAcreditarToggle = true, // 👈 NUEVO (default visible para mantener comportamiento actual)
}: {
  id_campana: string;
  formConfig?: CampoFormulario[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  isOpen: boolean;
  onClose: () => void;
  showAcreditarToggle?: boolean; // 👈 NUEVO
}) => {
  const [step, setStep] = useState<"email_check" | "form">("email_check");
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const validationSchema = generarSchemaValidacion(formConfig);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormDataShape>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      acreditar_ahora: showAcreditarToggle ? true : false, // 👈 depende del contexto
    },
  });

  useEffect(() => {
    if (isOpen) {
      setStep("email_check");
      setEmail("");
      reset({ acreditar_ahora: showAcreditarToggle ? true : false }); // 👈 depende del contexto
    }
  }, [isOpen, reset, showAcreditarToggle]);

  const handleCheckEmail = async () => {
    const emailSchema = yup.string().email("Email no válido").required("Email requerido");
    try {
      await emailSchema.validate(email);
    } catch (err: any) {
      toast.error(err.message);
      return;
    }

    setIsVerifying(true);
    const toastId = toast.loading("Buscando contacto...");
    try {
      const response = await apiFetch(`/contactos/email/${email}`);

      if (response.ok) {
        const contacto = await response.json();
        reset({ ...contacto, acreditar_ahora: showAcreditarToggle ? true : false }); // 👈
        toast.success("Contacto encontrado. Hemos rellenado sus datos.", { id: toastId });
      } else {
        reset({ email, acreditar_ahora: showAcreditarToggle ? true : false }); // 👈
        toast.success("Contacto nuevo. Por favor, completa el formulario.", { id: toastId });
      }

      setStep("form");
    } catch (error: any) {
      toast.error("Error al conectar con el servidor. Inténtalo de nuevo.", { id: toastId });
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFormSubmit = (formData: FormDataShape) => {
    const standardContactFields = new Set([
      "nombre",
      "email",
      "telefono",
      "rut",
      "empresa",
      "actividad",
      "profesion",
      "comuna",
      "pais",
    ]);

    const datosContacto: { [key: string]: any } = {};
    const respuestas: { id_campo: number; valor: any }[] = [];

    for (const key in formData) {
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        const value = formData[key];

        if (standardContactFields.has(key)) {
          datosContacto[key] = value;
        } else if (key !== "acreditar_ahora" && key !== "estado_asistencia") {  // 👈 añade este filtro
          const campoConfig = formConfig.find((c) => c.nombre_interno === key);
          if (campoConfig && value) {
            respuestas.push({
              id_campo: campoConfig.id_campo,
              valor: Array.isArray(value) ? JSON.stringify(value) : value,
            });
          }
        }
      }
    }

    // 👇 Si el toggle está oculto, forzamos false (y opcionalmente lo omitimos)
    const acreditar_ahora_final = showAcreditarToggle ? !!formData.acreditar_ahora : false;

    const payload = {
      ...datosContacto,
      respuestas,
      acreditar_ahora: acreditar_ahora_final,
    };

    onSubmit(payload);
  };

  const sortedFormConfig = useMemo(() => {
    const systemFieldsOrder = [
      "nombre",
      "email",
      "rut",
      "telefono",
      "pais",
      "comuna",
      "empresa",
      "actividad",
      "profesion",
    ];

    const systemFields: CampoFormulario[] = [];
    const customFields: CampoFormulario[] = [];

    formConfig.forEach((campo) => {
      if (campo.es_de_sistema) {
        systemFields.push(campo);
      } else {
        customFields.push(campo);
      }
    });

    systemFields.sort((a, b) => {
      const indexA = systemFieldsOrder.indexOf(a.nombre_interno);
      const indexB = systemFieldsOrder.indexOf(b.nombre_interno);
      return indexA - indexB;
    });

    return [...systemFields, ...customFields];
  }, [formConfig]);

  const getOpciones = (opciones?: any): string[] => {
    if (!opciones) return [];
    if (
      Array.isArray(opciones) &&
      opciones.length > 0 &&
      typeof opciones[0] === "object" &&
      opciones[0] !== null
    ) {
      return opciones.map((opt) => opt.etiqueta_opcion).filter(Boolean);
    }
    if (typeof opciones === "string") {
      return opciones
        .split(",")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);
    }
    if (Array.isArray(opciones)) {
      return opciones.map((opt) => String(opt).trim()).filter((opt) => opt.length > 0);
    }
    return [];
  };

  const renderCampo = (campo: CampoFormulario) => {
    if (!campo.es_visible) return null;
    const fieldName = campo.nombre_interno;
    const error = errors[fieldName];
    const etiqueta = fieldName === "nombre" ? "Nombre Completo" : campo.etiqueta;

    if (fieldName === "email") {
      return (
        <div key={campo.id_campo}>
          <Label htmlFor={fieldName}>
            {etiqueta}
            {campo.es_obligatorio ? "*" : ""}
          </Label>
          <Input {...register(fieldName)} readOnly className="bg-gray-100 cursor-not-allowed" />
          {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
        </div>
      );
    }

    if (fieldName === "pais") {
      return (
        <div key={campo.id_campo}>
          <Label htmlFor={fieldName}>
            {etiqueta}
            {campo.es_obligatorio ? "*" : ""}
          </Label>
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecciona un país...</option>
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            )}
          />
          {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
        </div>
      );
    }

    const opcionesArray = getOpciones(campo.opciones);

    switch (campo.tipo_campo) {
      case "TEXTO_CORTO":
        return (
          <div key={campo.id_campo}>
            <Label htmlFor={fieldName}>
              {etiqueta}
              {campo.es_obligatorio ? "*" : ""}
            </Label>
            <Input id={fieldName} {...register(fieldName)} />
            {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
          </div>
        );

      case "PARRAFO":
        return (
          <div key={campo.id_campo}>
            <Label htmlFor={fieldName}>
              {etiqueta}
              {campo.es_obligatorio ? "*" : ""}
            </Label>
            <Textarea id={fieldName} {...register(fieldName)} />
            {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
          </div>
        );

      case "DESPLEGABLE":
        return (
          <div key={campo.id_campo}>
            <Label htmlFor={fieldName}>
              {etiqueta}
              {campo.es_obligatorio ? "*" : ""}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={typeof field.value === "string" ? field.value : ""}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona una opción...</option>
                  {opcionesArray.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            />
            {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
          </div>
        );

      case "SELECCION_UNICA":
        return (
          <div key={campo.id_campo}>
            <Label>
              {etiqueta}
              {campo.es_obligatorio ? "*" : ""}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              render={({ field }) => (
                <div className="space-y-2 rounded-md border p-2 mt-1">
                  {opcionesArray.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${fieldName}-${i}`}
                        {...field}
                        value={opt}
                        checked={typeof field.value === "string" && field.value === opt}
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <Label htmlFor={`${fieldName}-${i}`}>{opt}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
          </div>
        );

      case "CASILLAS":
        return (
          <div key={campo.id_campo}>
            <Label>
              {etiqueta}
              {campo.es_obligatorio ? "*" : ""}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-2 rounded-md border p-2 mt-1">
                  {opcionesArray.map((opt, i) => {
                    const currentValues = Array.isArray(field.value) ? field.value : [];
                    return (
                      <div key={i} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${fieldName}-${i}`}
                          checked={currentValues.includes(opt)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...currentValues, opt]);
                            } else {
                              field.onChange(currentValues.filter((v) => v !== opt));
                            }
                          }}
                        />
                        <Label htmlFor={`${fieldName}-${i}`}>{opt}</Label>
                      </div>
                    );
                  })}
                </div>
              )}
            />
            {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
          </div>
        );

      case "ARCHIVO":
        return (
          <div key={campo.id_campo}>
            <Label htmlFor={fieldName}>
              {etiqueta}
              {campo.es_obligatorio ? "*" : ""}
            </Label>
            <Input
              id={fieldName}
              type="file"
              {...register(fieldName)}
              onChange={(e) => {
                const files = e.target.files;
                (register(fieldName).onChange as any)(files?.length ? files : null);
              }}
            />
            {error && <p className="text-red-500 text-xs mt-1">{(error as any).message}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar en Puerta</DialogTitle>
          <DialogDescription>
            {step === "email_check"
              ? "Ingresa el correo del asistente para verificar si ya existe."
              : "Completa los datos del nuevo asistente para registrarlo."}
          </DialogDescription>
        </DialogHeader>

        {step === "email_check" ? (
          <div className="py-4 space-y-4">
            <Label htmlFor="email-check">Correo Electrónico*</Label>
            <Input
              id="email-check"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@ejemplo.com"
            />
            <DialogFooter>
              <Button onClick={handleCheckEmail} disabled={isVerifying} className="w-full">
                {isVerifying ? "Verificando..." : "Verificar y Continuar"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="py-4 max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("email_check")}
                className="-ml-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a verificar email
              </Button>

              {/* Campos dinámicos */}
              {sortedFormConfig.map(renderCampo)}

              {/* Checkbox acreditación: solo si se permite mostrar */}
              {showAcreditarToggle && (
                <div className="flex items-center space-x-2 border rounded-md p-2">
                  <Controller
                    name="acreditar_ahora"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="acreditar_ahora"
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    )}
                  />
                  <Label htmlFor="acreditar_ahora">
                    Acreditar inmediatamente al guardar
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Finalizar Registro"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarEnPuertaDialog;
