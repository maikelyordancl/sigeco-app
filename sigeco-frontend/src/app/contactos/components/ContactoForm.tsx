"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Resolver, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Contacto } from "../types/contacto";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api";
import { CountrySelector } from "@/components/ui/CountrySelector";
import countryList from 'react-select-country-list';

// El esquema de validación no cambia
const validationSchema = Yup.object().shape({
  nombre: Yup.string().optional(),
  email: Yup.string().email("Email inválido").required("El email es obligatorio."),
  telefono: Yup.string().optional().nullable(),
  pais: Yup.object()
    .shape({
      label: Yup.string().required(),
      value: Yup.string().required(),
    })
    .required("El país es obligatorio."),
  comuna: Yup.string().nullable().optional(),
  rut: Yup.string().nullable().optional(),
  empresa: Yup.string().nullable().optional(),
  actividad: Yup.string().nullable().optional(),
  profesion: Yup.string().nullable().optional(),
  recibir_mail: Yup.boolean().optional(),
});

type ContactoFormData = Omit<Contacto, 'pais'> & {
  pais: { label: string, value: string };
};

type ContactoFormProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contacto?: Contacto | null;
  refreshContactos: () => void;
};


const ContactoForm: React.FC<ContactoFormProps> = ({ open, setOpen, contacto, refreshContactos }) => {
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const countryOptions = useMemo(() => countryList().getData(), []);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ContactoFormData>({
    resolver: yupResolver(validationSchema) as unknown as Resolver<ContactoFormData>,
  });

  useEffect(() => {
    const chileOption = countryOptions.find(opt => opt.value === 'CL');
    
    if (contacto) {
      // Si estamos editando, buscamos el país del contacto.
      // Si no tiene país o está en blanco, usamos Chile por defecto.
      const contactCountry = countryOptions.find(opt => opt.value === contacto.pais) || chileOption;
      reset({
        ...contacto,
        pais: contactCountry
      });
    } else {
      // Si estamos creando un nuevo contacto, usamos Chile por defecto.
      reset({
        nombre: "",
        email: "",
        telefono: "",
        rut: "",
        empresa: "",
        actividad: "",
        profesion: "",
        pais: chileOption,
        comuna: "",
        recibir_mail: true,
      });
    }
  }, [contacto, reset, countryOptions]);


  const onSubmit = async (data: ContactoFormData) => {
    setLoading(true);
    setErrorModal(null);

    const payload = {
      ...data,
      pais: data.pais.value,
    };
    
    const isEditing = !!contacto;
    const url = isEditing
      ? `/contactos/${contacto.id_contacto}`
      : `/contactos`;
    const metodo = isEditing ? "PUT" : "POST";

    try {
      const response = await apiFetch(url, {
        method: metodo,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setOpen(false);
        toast.success(isEditing ? "Contacto actualizado." : "Contacto agregado.");
        refreshContactos();
      } else {
        setErrorModal(result.error || "Error al guardar el contacto.");
      }
    } catch (error) {
      setErrorModal("Error de red al guardar el contacto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contacto ? "Editar Contacto" : "Agregar Contacto"}</DialogTitle>
        </DialogHeader>

        {errorModal && <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">{errorModal}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register("nombre")} placeholder="Nombre Completo (Opcional)" />
          {errors.nombre && <p className="text-red-500">{errors.nombre.message}</p>}

          <Input type="email" {...register("email")} placeholder="Email" />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}

          <div>
            <Controller
  name="pais"
  control={control}
  render={({ field }) => (
    <CountrySelector {...field} control={control} />
  )}
/>
            {errors.pais && <p className="text-red-500">{(errors.pais as any).value?.message || errors.pais.message}</p>}
          </div>
          <Input {...register("comuna")} placeholder="Comuna (Opcional)" />
          <Input {...register("telefono")} placeholder="Teléfono (Opcional)" />
          {errors.telefono && <p className="text-red-500">{errors.telefono.message}</p>}

          <Input {...register("rut")} placeholder="RUT (Opcional)" />
          {errors.rut && <p className="text-red-500">{errors.rut.message}</p>}

          <Input {...register("empresa")} placeholder="Empresa (Opcional)" />
          <Input {...register("actividad")} placeholder="Actividad (Opcional)" />
          <Input {...register("profesion")} placeholder="Profesión (Opcional)" />

          <div className="flex items-center space-x-2">
            <input type="checkbox" {...register("recibir_mail")} id="recibir_mail" />
            <label htmlFor="recibir_mail">¿Desea recibir correos?</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactoForm;